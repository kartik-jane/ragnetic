import sqlite3
import os
from datetime import datetime
import google.genai as genai
import bcrypt
import json
from threading import Lock

class SQLiteHandler:
    def __init__(self):
        self.db_path = os.path.join(os.path.dirname(__file__), 'ragnetic.db')
        self.connection = None
        self.lock = Lock()  # Thread-safe operations
        self.connect()
        self.create_tables()
    
    def connect(self):
        try:
            self.connection = sqlite3.connect(self.db_path, check_same_thread=False)
            self.connection.row_factory = sqlite3.Row  # Return rows as dictionaries
            print(f"[SQLite] Connected successfully to {self.db_path}")
        except Exception as e:
            print(f"[SQLite] Connection error: {e}")
    
    def get_connection(self):
        """Get a thread-safe connection"""
        return sqlite3.connect(self.db_path, check_same_thread=False)
    
    def create_tables(self):
        try:
            with self.lock:
                cursor = self.connection.cursor()
                
                # Admin table (fixed credentials)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS admin (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        username TEXT UNIQUE NOT NULL,
                        password_hash TEXT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                # Insert default admin if not exists
                cursor.execute("SELECT COUNT(*) FROM admin")
                admin_count = cursor.fetchone()[0]
                if admin_count == 0:
                    # Default admin credentials: username='admin', password='admin123'
                    admin_password_hash = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                    cursor.execute(
                        "INSERT INTO admin (username, password_hash) VALUES (?, ?)",
                        ('admin', admin_password_hash)
                    )
                    print("[SQLite] Default admin created (username: admin, password: admin123)")
                
                # Users table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        full_name TEXT NOT NULL,
                        username TEXT UNIQUE NOT NULL,
                        email TEXT UNIQUE NOT NULL,
                        password_hash TEXT NOT NULL,
                        role TEXT DEFAULT 'user' CHECK(role IN ('user', 'management')),
                        is_active INTEGER DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                # Migration: Add is_active column if it doesn't exist
                try:
                    cursor.execute("SELECT is_active FROM users LIMIT 1")
                except Exception:
                    # Column doesn't exist, add it and set all existing users to active
                    print("[SQLite] Adding is_active column to users table...")
                    cursor.execute("ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1")
                    print("[SQLite] Migration completed - all existing users set to active")
                
                # API Keys table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS api_keys (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        email TEXT UNIQUE NOT NULL,
                        api_key TEXT UNIQUE NOT NULL,
                        is_used INTEGER DEFAULT 0,
                        role TEXT DEFAULT 'user' CHECK(role IN ('user', 'management')),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                # Conversations table (supports both users and admin)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS conversations (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER,
                        admin_id INTEGER,
                        title TEXT NOT NULL,
                        is_deleted INTEGER DEFAULT 0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                        FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE
                    )
                """)
                
                # Migration: Add admin_id column if it doesn't exist
                try:
                    cursor.execute("SELECT admin_id FROM conversations LIMIT 1")
                except Exception:
                    # Column doesn't exist, add it
                    print("[SQLite] Adding admin_id column to conversations table...")
                    cursor.execute("ALTER TABLE conversations ADD COLUMN admin_id INTEGER")
                    cursor.execute("CREATE INDEX IF NOT EXISTS idx_conversations_admin_id ON conversations(admin_id)")
                    print("[SQLite] Migration completed")
                
                # Create trigger for updated_at on conversations
                cursor.execute("""
                    CREATE TRIGGER IF NOT EXISTS update_conversations_timestamp 
                    AFTER UPDATE ON conversations
                    BEGIN
                        UPDATE conversations SET updated_at = CURRENT_TIMESTAMP
                        WHERE id = NEW.id;
                    END
                """)
                
                # Messages table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS messages (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        conversation_id INTEGER NOT NULL,
                        role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
                        content TEXT NOT NULL,
                        attached_files TEXT DEFAULT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
                    )
                """)
                
                self.connection.commit()
                print("[SQLite] Tables created successfully")
        except Exception as e:
            print(f"[SQLite] Table creation error: {e}")
            self.connection.rollback()
    
    def generate_title(self, first_message):
        """Generate conversation title using Gemini API"""
        try:
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                return first_message[:50] + "..." if len(first_message) > 50 else first_message
            
            client = genai.Client(api_key=api_key)
            
            prompt = f"Generate a short 3-5 word title for a conversation that starts with: '{first_message[:100]}'. Only return the title, nothing else."
            response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
            title = response.text.strip().replace('"', '').replace("'", "")
            
            return title[:100]  # Limit to 100 chars
        except:
            return first_message[:50] + "..." if len(first_message) > 50 else first_message
    
    def create_conversation(self, first_message, user_id=None, admin_id=None):
        """Create a new conversation with auto-generated title for user or admin"""
        try:
            with self.lock:
                title = self.generate_title(first_message)
                cursor = self.connection.cursor()
                if admin_id:
                    cursor.execute("INSERT INTO conversations (title, admin_id) VALUES (?, ?)", (title, admin_id))
                else:
                    cursor.execute("INSERT INTO conversations (title, user_id) VALUES (?, ?)", (title, user_id))
                self.connection.commit()
                conversation_id = cursor.lastrowid
                return conversation_id
        except Exception as e:
            print(f"[SQLite] Error creating conversation: {e}")
            return None
    
    def add_message(self, conversation_id, role, content, attached_files=None):
        """Add a message to a conversation with optional attached files"""
        try:
            with self.lock:
                cursor = self.connection.cursor()
                files_json = json.dumps(attached_files) if attached_files else None
                cursor.execute(
                    "INSERT INTO messages (conversation_id, role, content, attached_files) VALUES (?, ?, ?, ?)",
                    (conversation_id, role, content, files_json)
                )
                self.connection.commit()
                return True
        except Exception as e:
            print(f"[SQLite] Error adding message: {e}")
            return False
    
    def get_conversations(self, user_id=None, admin_id=None):
        """Get all active (non-deleted) conversations for a user or admin ordered by most recent"""
        try:
            with self.lock:
                cursor = self.connection.cursor()
                if admin_id:
                    cursor.execute("""
                        SELECT id, title, created_at, updated_at 
                        FROM conversations 
                        WHERE is_deleted = 0 AND admin_id = ?
                        ORDER BY updated_at DESC
                    """, (admin_id,))
                else:
                    cursor.execute("""
                        SELECT id, title, created_at, updated_at 
                        FROM conversations 
                        WHERE is_deleted = 0 AND user_id = ?
                        ORDER BY updated_at DESC
                    """, (user_id,))
                rows = cursor.fetchall()
                conversations = [dict(row) for row in rows]
                return conversations
        except Exception as e:
            print(f"[SQLite] Error getting conversations: {e}")
            return []
    
    def get_conversation_messages(self, conversation_id):
        """Get all messages from a conversation"""
        try:
            with self.lock:
                cursor = self.connection.cursor()
                cursor.execute("""
                    SELECT id, role, content, attached_files, created_at 
                    FROM messages 
                    WHERE conversation_id = ? 
                    ORDER BY created_at ASC
                """, (conversation_id,))
                rows = cursor.fetchall()
                messages = [dict(row) for row in rows]
                
                # Parse JSON attached_files back to list
                for msg in messages:
                    if msg.get('attached_files'):
                        try:
                            msg['attached_files'] = json.loads(msg['attached_files'])
                        except:
                            msg['attached_files'] = None
                
                return messages
        except Exception as e:
            print(f"[SQLite] Error getting messages: {e}")
            return []
    
    def delete_conversation(self, conversation_id):
        """Soft delete a conversation (move to trash)"""
        try:
            with self.lock:
                cursor = self.connection.cursor()
                cursor.execute(
                    "UPDATE conversations SET is_deleted = 1 WHERE id = ?", 
                    (conversation_id,)
                )
                self.connection.commit()
                return True
        except Exception as e:
            print(f"[SQLite] Error deleting conversation: {e}")
            return False
    
    def get_deleted_conversations(self):
        """Get all deleted conversations"""
        try:
            with self.lock:
                cursor = self.connection.cursor()
                cursor.execute("""
                    SELECT id, title, created_at, updated_at 
                    FROM conversations 
                    WHERE is_deleted = 1
                    ORDER BY updated_at DESC
                """)
                rows = cursor.fetchall()
                conversations = [dict(row) for row in rows]
                return conversations
        except Exception as e:
            print(f"[SQLite] Error getting deleted conversations: {e}")
            return []
    
    def restore_conversation(self, conversation_id):
        """Restore a deleted conversation"""
        try:
            with self.lock:
                cursor = self.connection.cursor()
                cursor.execute(
                    "UPDATE conversations SET is_deleted = 0 WHERE id = ?", 
                    (conversation_id,)
                )
                self.connection.commit()
                return True
        except Exception as e:
            print(f"[SQLite] Error restoring conversation: {e}")
            return False
    
    def permanently_delete_conversation(self, conversation_id):
        """Permanently delete a conversation and all its messages"""
        try:
            with self.lock:
                cursor = self.connection.cursor()
                cursor.execute("DELETE FROM conversations WHERE id = ?", (conversation_id,))
                self.connection.commit()
                return True
        except Exception as e:
            print(f"[SQLite] Error permanently deleting conversation: {e}")
            return False
    
    def update_conversation_title(self, conversation_id, new_title):
        """Update conversation title"""
        try:
            with self.lock:
                cursor = self.connection.cursor()
                cursor.execute(
                    "UPDATE conversations SET title = ? WHERE id = ?",
                    (new_title, conversation_id)
                )
                self.connection.commit()
                return True
        except Exception as e:
            print(f"[SQLite] Error updating title: {e}")
            return False
    
    def create_user(self, full_name, username, email, password, api_key, role='user'):
        """Create a new user with hashed password and API key validation"""
        try:
            with self.lock:
                # Verify API key exists and is not used
                cursor = self.connection.cursor()
                cursor.execute(
                    "SELECT id, email, is_used, role FROM api_keys WHERE api_key = ?",
                    (api_key,)
                )
                row = cursor.fetchone()
                key_data = dict(row) if row else None
                
                if not key_data:
                    return None, "Invalid API key"
                
                if key_data['is_used']:
                    return None, "API key already used"
                
                # Verify email matches the API key's registered email
                if key_data['email'].lower() != email.lower():
                    return None, "API key is not registered for this email address"
                
                # Verify role matches the API key's role
                if key_data['role'] != role:
                    return None, f"API key is for {key_data['role']} role, not {role}"
                
                # Hash the password
                password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                
                try:
                    # Create user
                    cursor.execute(
                        "INSERT INTO users (full_name, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)",
                        (full_name, username, email, password_hash, role)
                    )
                    user_id = cursor.lastrowid
                    
                    # Mark API key as used
                    cursor.execute(
                        "UPDATE api_keys SET is_used = 1 WHERE api_key = ?",
                        (api_key,)
                    )
                    
                    self.connection.commit()
                    return user_id, None
                except sqlite3.IntegrityError as e:
                    self.connection.rollback()
                    print(f"[SQLite] User already exists: {e}")
                    return None, "Username or email already exists"
        except Exception as e:
            print(f"[SQLite] Error creating user: {e}")
            return None, str(e)
    
    def verify_user(self, username, password):
        """Verify user credentials and return user info if valid"""
        try:
            with self.lock:
                cursor = self.connection.cursor()
                cursor.execute(
                    "SELECT id, full_name, username, email, password_hash, role FROM users WHERE username = ? AND is_active = 1",
                    (username,)
                )
                row = cursor.fetchone()
                user = dict(row) if row else None
                
                if user and bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
                    # Remove password hash from returned data
                    del user['password_hash']
                    return user
                return None
        except Exception as e:
            print(f"[SQLite] Error verifying user: {e}")
            return None
    
    def verify_admin(self, username, password):
        """Verify admin credentials and return admin info if valid"""
        try:
            with self.lock:
                cursor = self.connection.cursor()
                cursor.execute(
                    "SELECT id, username, password_hash FROM admin WHERE username = ?",
                    (username,)
                )
                row = cursor.fetchone()
                admin = dict(row) if row else None
                
                if admin and bcrypt.checkpw(password.encode('utf-8'), admin['password_hash'].encode('utf-8')):
                    # Remove password hash from returned data
                    del admin['password_hash']
                    return admin
                return None
        except Exception as e:
            print(f"[SQLite] Error verifying admin: {e}")
            return None
    
    def verify_admin_by_id(self, admin_id):
        """Verify admin by ID and return admin info"""
        try:
            with self.lock:
                cursor = self.connection.cursor()
                cursor.execute(
                    "SELECT id, username, password_hash FROM admin WHERE id = ?",
                    (admin_id,)
                )
                row = cursor.fetchone()
                admin = dict(row) if row else None
                return admin
        except Exception as e:
            print(f"[SQLite] Error verifying admin by ID: {e}")
            return None
    
    def update_admin_password(self, admin_id, new_password_hash):
        """Update admin password"""
        try:
            with self.lock:
                cursor = self.connection.cursor()
                cursor.execute(
                    "UPDATE admin SET password_hash = ? WHERE id = ?",
                    (new_password_hash, admin_id)
                )
                self.connection.commit()
                return True
        except Exception as e:
            print(f"[SQLite] Error updating admin password: {e}")
            return False
    
    def get_all_users(self):
        """Get all users with their basic info"""
        try:
            with self.lock:
                cursor = self.connection.cursor()
                cursor.execute("""
                    SELECT id, full_name, username, email, role, is_active, created_at,
                    (SELECT COUNT(*) FROM conversations WHERE user_id = users.id AND is_deleted = 0) as conversation_count
                    FROM users
                    ORDER BY created_at DESC
                """)
                rows = cursor.fetchall()
                users = [dict(row) for row in rows]
                return users
        except Exception as e:
            print(f"[SQLite] Error getting users: {e}")
            return []
    
    def get_users_by_role(self, role):
        """Get active users by role"""
        try:
            with self.lock:
                cursor = self.connection.cursor()
                cursor.execute("""
                    SELECT id, full_name, username, email, is_active, created_at,
                    (SELECT COUNT(*) FROM conversations WHERE user_id = users.id AND is_deleted = 0) as conversation_count
                    FROM users
                    WHERE role = ? AND is_active = 1
                    ORDER BY created_at DESC
                """, (role,))
                rows = cursor.fetchall()
                users = [dict(row) for row in rows]
                return users
        except Exception as e:
            print(f"[SQLite] Error getting users by role: {e}")
            return []
    
    def get_user_by_id(self, user_id):
        """Get user information by ID"""
        try:
            with self.lock:
                cursor = self.connection.cursor()
                cursor.execute(
                    "SELECT id, full_name, username, email, role, created_at FROM users WHERE id = ?",
                    (user_id,)
                )
                row = cursor.fetchone()
                user = dict(row) if row else None
                return user
        except Exception as e:
            print(f"[SQLite] Error getting user: {e}")
            return None
    
    def generate_api_key(self, email, role='user'):
        """Generate a unique 16-character API key for an email"""
        import secrets
        import string
        
        try:
            with self.lock:
                cursor = self.connection.cursor()
                
                # Check if email already has an API key
                cursor.execute("SELECT id FROM api_keys WHERE email = ?", (email,))
                if cursor.fetchone():
                    return None, "Email already has an API key"
                
                # Generate unique API key
                characters = string.ascii_uppercase + string.digits
                while True:
                    api_key = ''.join(secrets.choice(characters) for _ in range(16))
                    cursor.execute("SELECT id FROM api_keys WHERE api_key = ?", (api_key,))
                    if not cursor.fetchone():
                        break
                
                # Insert API key
                cursor.execute(
                    "INSERT INTO api_keys (email, api_key, role) VALUES (?, ?, ?)",
                    (email, api_key, role)
                )
                self.connection.commit()
                return api_key, None
        except Exception as e:
            print(f"[SQLite] Error generating API key: {e}")
            return None, str(e)
    
    def get_all_api_keys(self):
        """Get all API keys"""
        try:
            with self.lock:
                cursor = self.connection.cursor()
                cursor.execute("""
                    SELECT id, email, api_key, is_used, 
                           COALESCE(role, 'user') as role, created_at
                    FROM api_keys
                    ORDER BY created_at DESC
                """)
                rows = cursor.fetchall()
                keys = [dict(row) for row in rows]
                return keys
        except Exception as e:
            print(f"[SQLite] Error getting API keys: {e}")
            return []
    
    def delete_user(self, user_id):
        """Delete a user and all associated data"""
        try:
            with self.lock:
                cursor = self.connection.cursor()
                cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
                self.connection.commit()
                return True
        except Exception as e:
            print(f"[SQLite] Error deleting user: {e}")
            return False
    
    def toggle_user_status(self, user_id):
        """Toggle user active/inactive status"""
        try:
            with self.lock:
                cursor = self.connection.cursor()
                # Get current status
                cursor.execute("SELECT is_active FROM users WHERE id = ?", (user_id,))
                row = cursor.fetchone()
                if not row:
                    return False, "User not found"
                
                current_status = row[0]
                new_status = 0 if current_status == 1 else 1
                
                # Update status
                cursor.execute("UPDATE users SET is_active = ? WHERE id = ?", (new_status, user_id))
                self.connection.commit()
                return True, new_status
        except Exception as e:
            print(f"[SQLite] Error toggling user status: {e}")
            return False, str(e)
    
    def delete_api_key(self, key_id):
        """Delete an API key"""
        try:
            with self.lock:
                cursor = self.connection.cursor()
                cursor.execute("DELETE FROM api_keys WHERE id = ?", (key_id,))
                self.connection.commit()
                return True
        except Exception as e:
            print(f"[SQLite] Error deleting API key: {e}")
            return False
    
    def update_user(self, user_id, update_data):
        """Update user information"""
        try:
            with self.lock:
                cursor = self.connection.cursor()
                
                # Build dynamic update query
                set_parts = []
                values = []
                for key, value in update_data.items():
                    set_parts.append(f"{key} = ?")
                    values.append(value)
                
                if not set_parts:
                    return False
                
                query = f"UPDATE users SET {', '.join(set_parts)} WHERE id = ?"
                values.append(user_id)
                
                cursor.execute(query, values)
                self.connection.commit()
                return cursor.rowcount > 0
        except Exception as e:
            print(f"[SQLite] Error updating user: {e}")
            return False
    
    def get_user_by_username(self, username):
        """Get user by username"""
        try:
            with self.lock:
                cursor = self.connection.cursor()
                cursor.execute(
                    "SELECT id, full_name, username, email, role, created_at FROM users WHERE username = ?",
                    (username,)
                )
                row = cursor.fetchone()
                return dict(row) if row else None
        except Exception as e:
            print(f"[SQLite] Error getting user by username: {e}")
            return None
    
    def get_user_by_email(self, email):
        """Get user by email"""
        try:
            with self.lock:
                cursor = self.connection.cursor()
                cursor.execute(
                    "SELECT id, full_name, username, email, role, created_at FROM users WHERE email = ?",
                    (email,)
                )
                row = cursor.fetchone()
                return dict(row) if row else None
        except Exception as e:
            print(f"[SQLite] Error getting user by email: {e}")
            return None
    
    def close(self):
        if self.connection:
            self.connection.close()
