import mysql.connector
import os
from datetime import datetime
import google.generativeai as genai
import bcrypt

class MySQLHandler:
    def __init__(self):
        self.connection = None
        self.connect()
        self.create_tables()
    
    def connect(self):
        try:
            self.connection = mysql.connector.connect(
                host=os.getenv("MYSQL_HOST"),
                user=os.getenv("MYSQL_USER"),
                password=os.getenv("MYSQL_PASSWORD"),
                port=int(os.getenv("MYSQL_PORT"))
            )
            cursor = self.connection.cursor()
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {os.getenv('MYSQL_DATABASE')}")
            cursor.close()
            self.connection.database = os.getenv('MYSQL_DATABASE')
            print("[MySQL] Connected successfully")
        except Exception as e:
            print(f"[MySQL] Connection error: {e}")
    
    def create_tables(self):
        try:
            cursor = self.connection.cursor()
            
            # Admin table (fixed credentials)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS admin (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(100) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Insert default admin if not exists
            cursor.execute("SELECT COUNT(*) FROM admin")
            admin_count = cursor.fetchone()[0]
            if admin_count == 0:
                # Default admin credentials: username='admin', password='admin123'
                admin_password_hash = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt())
                cursor.execute(
                    "INSERT INTO admin (username, password_hash) VALUES (%s, %s)",
                    ('admin', admin_password_hash)
                )
                print("[MySQL] Default admin created (username: admin, password: admin123)")
            
            # Users table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    full_name VARCHAR(255) NOT NULL,
                    username VARCHAR(100) UNIQUE NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    role ENUM('user', 'management') DEFAULT 'user',
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Migration: Add role and is_active columns if they don't exist
            try:
                cursor.execute("SELECT role FROM users LIMIT 1")
            except:
                cursor.execute("ALTER TABLE users ADD COLUMN role ENUM('user', 'management') DEFAULT 'user'")
                print("[MySQL] Added role column to users table")
            
            try:
                cursor.execute("SELECT is_active FROM users LIMIT 1")
            except:
                cursor.execute("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE")
                print("[MySQL] Added is_active column to users table")
            
            # API Keys table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS api_keys (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    api_key VARCHAR(16) UNIQUE NOT NULL,
                    is_used BOOLEAN DEFAULT FALSE,
                    role ENUM('user', 'management') DEFAULT 'user',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Conversations table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS conversations (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    is_deleted BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            """)
            
            # Messages table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    conversation_id INT NOT NULL,
                    role ENUM('user', 'assistant') NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
                )
            """)
            
            # Migration: Add is_deleted column if it doesn't exist
            try:
                cursor.execute("""
                    ALTER TABLE conversations 
                    ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE
                """)
                print("[MySQL] Added is_deleted column to existing table")
            except mysql.connector.Error as e:
                if e.errno == 1060:  # Duplicate column name
                    pass  # Column already exists
                else:
                    print(f"[MySQL] Migration warning: {e}")
            
            # Migration: Add full_name column to users if it doesn't exist
            try:
                cursor.execute("""
                    ALTER TABLE users 
                    ADD COLUMN full_name VARCHAR(255) AFTER id
                """)
                print("[MySQL] Added full_name column to users table")
            except mysql.connector.Error as e:
                if e.errno == 1060:  # Duplicate column name
                    pass  # Column already exists
                else:
                    print(f"[MySQL] Migration warning: {e}")
            
            # Migration: Add attached_files column to messages if it doesn't exist
            try:
                cursor.execute("""
                    ALTER TABLE messages 
                    ADD COLUMN attached_files JSON DEFAULT NULL
                """)
                print("[MySQL] Added attached_files column to messages table")
            except mysql.connector.Error as e:
                if e.errno == 1060:  # Duplicate column name
                    pass  # Column already exists
                else:
                    print(f"[MySQL] Migration warning: {e}")
            
            # Migration: Add role column to users if it doesn't exist
            try:
                cursor.execute("""
                    ALTER TABLE users 
                    ADD COLUMN role ENUM('user', 'management') DEFAULT 'user'
                """)
                print("[MySQL] Added role column to users table")
            except mysql.connector.Error as e:
                if e.errno == 1060:  # Duplicate column name
                    pass  # Column already exists
                else:
                    print(f"[MySQL] Migration warning: {e}")
            
            self.connection.commit()
            cursor.close()
            print("[MySQL] Tables created successfully")
        except Exception as e:
            print(f"[MySQL] Table creation error: {e}")
    
    def generate_title(self, first_message):
        """Generate conversation title using Gemini API"""
        try:
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                return first_message[:50] + "..." if len(first_message) > 50 else first_message
            
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            prompt = f"Generate a short 3-5 word title for a conversation that starts with: '{first_message[:100]}'. Only return the title, nothing else."
            response = model.generate_content(prompt)
            title = response.text.strip().replace('"', '').replace("'", "")
            
            return title[:100]  # Limit to 100 chars
        except:
            return first_message[:50] + "..." if len(first_message) > 50 else first_message
    
    def create_conversation(self, first_message, user_id):
        """Create a new conversation with auto-generated title"""
        try:
            title = self.generate_title(first_message)
            cursor = self.connection.cursor()
            cursor.execute("INSERT INTO conversations (title, user_id) VALUES (%s, %s)", (title, user_id))
            self.connection.commit()
            conversation_id = cursor.lastrowid
            cursor.close()
            return conversation_id
        except Exception as e:
            print(f"[MySQL] Error creating conversation: {e}")
            return None
    
    def add_message(self, conversation_id, role, content, attached_files=None):
        """Add a message to a conversation with optional attached files"""
        try:
            cursor = self.connection.cursor()
            import json
            files_json = json.dumps(attached_files) if attached_files else None
            cursor.execute(
                "INSERT INTO messages (conversation_id, role, content, attached_files) VALUES (%s, %s, %s, %s)",
                (conversation_id, role, content, files_json)
            )
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"[MySQL] Error adding message: {e}")
            return False
    
    def get_conversations(self, user_id):
        """Get all active (non-deleted) conversations for a user ordered by most recent"""
        try:
            cursor = self.connection.cursor(dictionary=True)
            cursor.execute("""
                SELECT id, title, created_at, updated_at 
                FROM conversations 
                WHERE is_deleted = FALSE AND user_id = %s
                ORDER BY updated_at DESC
            """, (user_id,))
            conversations = cursor.fetchall()
            cursor.close()
            return conversations
        except Exception as e:
            print(f"[MySQL] Error getting conversations: {e}")
            return []
    
    def get_conversation_messages(self, conversation_id):
        """Get all messages from a conversation"""
        try:
            cursor = self.connection.cursor(dictionary=True)
            cursor.execute("""
                SELECT id, role, content, attached_files, created_at 
                FROM messages 
                WHERE conversation_id = %s 
                ORDER BY created_at ASC
            """, (conversation_id,))
            messages = cursor.fetchall()
            cursor.close()
            
            # Parse JSON attached_files back to list
            import json
            for msg in messages:
                if msg.get('attached_files'):
                    try:
                        msg['attached_files'] = json.loads(msg['attached_files'])
                    except:
                        msg['attached_files'] = None
            
            return messages
        except Exception as e:
            print(f"[MySQL] Error getting messages: {e}")
            return []
    
    def delete_conversation(self, conversation_id):
        """Soft delete a conversation (move to trash)"""
        try:
            cursor = self.connection.cursor()
            cursor.execute(
                "UPDATE conversations SET is_deleted = TRUE WHERE id = %s", 
                (conversation_id,)
            )
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"[MySQL] Error deleting conversation: {e}")
            return False
    
    def get_deleted_conversations(self):
        """Get all deleted conversations"""
        try:
            cursor = self.connection.cursor(dictionary=True)
            cursor.execute("""
                SELECT id, title, created_at, updated_at 
                FROM conversations 
                WHERE is_deleted = TRUE
                ORDER BY updated_at DESC
            """)
            conversations = cursor.fetchall()
            cursor.close()
            return conversations
        except Exception as e:
            print(f"[MySQL] Error getting deleted conversations: {e}")
            return []
    
    def restore_conversation(self, conversation_id):
        """Restore a deleted conversation"""
        try:
            cursor = self.connection.cursor()
            cursor.execute(
                "UPDATE conversations SET is_deleted = FALSE WHERE id = %s", 
                (conversation_id,)
            )
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"[MySQL] Error restoring conversation: {e}")
            return False
    
    def permanently_delete_conversation(self, conversation_id):
        """Permanently delete a conversation and all its messages"""
        try:
            cursor = self.connection.cursor()
            cursor.execute("DELETE FROM conversations WHERE id = %s", (conversation_id,))
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"[MySQL] Error permanently deleting conversation: {e}")
            return False
    
    def update_conversation_title(self, conversation_id, new_title):
        """Update conversation title"""
        try:
            cursor = self.connection.cursor()
            cursor.execute(
                "UPDATE conversations SET title = %s WHERE id = %s",
                (new_title, conversation_id)
            )
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"[MySQL] Error updating title: {e}")
            return False
    
    def create_user(self, full_name, username, email, password, api_key, role='user'):
        """Create a new user with hashed password and API key validation"""
        try:
            # Verify API key exists and is not used
            cursor = self.connection.cursor(dictionary=True)
            cursor.execute(
                "SELECT id, email, is_used, role FROM api_keys WHERE api_key = %s",
                (api_key,)
            )
            key_data = cursor.fetchone()
            
            if not key_data:
                cursor.close()
                return None, "Invalid API key"
            
            if key_data['is_used']:
                cursor.close()
                return None, "API key already used"
            
            # Verify email matches the API key's registered email
            if key_data['email'].lower() != email.lower():
                cursor.close()
                return None, "API key is not registered for this email address"
            
            # Verify role matches the API key's role
            if key_data['role'] != role:
                cursor.close()
                return None, f"API key is for {key_data['role']} role, not {role}"
            
            # Hash the password
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            # Create user
            cursor.execute(
                "INSERT INTO users (full_name, username, email, password_hash, role) VALUES (%s, %s, %s, %s, %s)",
                (full_name, username, email, password_hash, role)
            )
            user_id = cursor.lastrowid
            
            # Mark API key as used
            cursor.execute(
                "UPDATE api_keys SET is_used = TRUE WHERE api_key = %s",
                (api_key,)
            )
            
            self.connection.commit()
            cursor.close()
            return user_id, None
        except mysql.connector.Error as e:
            if e.errno == 1062:  # Duplicate entry
                print(f"[MySQL] User already exists: {e}")
                return None, "Username or email already exists"
            print(f"[MySQL] Error creating user: {e}")
            return None, str(e)
    
    def verify_user(self, username, password):
        """Verify user credentials and return user info if valid"""
        try:
            cursor = self.connection.cursor(dictionary=True)
            cursor.execute(
                "SELECT id, full_name, username, email, password_hash, role FROM users WHERE username = %s AND is_active = TRUE",
                (username,)
            )
            user = cursor.fetchone()
            cursor.close()
            
            if user and bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
                # Remove password hash from returned data
                del user['password_hash']
                return user
            return None
        except Exception as e:
            print(f"[MySQL] Error verifying user: {e}")
            return None
    
    def verify_admin(self, username, password):
        """Verify admin credentials and return admin info if valid"""
        try:
            cursor = self.connection.cursor(dictionary=True)
            cursor.execute(
                "SELECT id, username, password_hash FROM admin WHERE username = %s",
                (username,)
            )
            admin = cursor.fetchone()
            cursor.close()
            
            if admin and bcrypt.checkpw(password.encode('utf-8'), admin['password_hash'].encode('utf-8')):
                # Remove password hash from returned data
                del admin['password_hash']
                return admin
            return None
        except Exception as e:
            print(f"[MySQL] Error verifying admin: {e}")
            return None
    
    def get_all_users(self):
        """Get all users with their basic info"""
        try:
            cursor = self.connection.cursor(dictionary=True)
            cursor.execute("""
                SELECT id, full_name, username, email, role, is_active, created_at,
                (SELECT COUNT(*) FROM conversations WHERE user_id = users.id AND is_deleted = FALSE) as conversation_count
                FROM users
                ORDER BY created_at DESC
            """)
            users = cursor.fetchall()
            cursor.close()
            return users
        except Exception as e:
            print(f"[MySQL] Error getting users: {e}")
            return []
    
    def get_users_by_role(self, role):
        """Get active users by role"""
        try:
            cursor = self.connection.cursor(dictionary=True)
            cursor.execute("""
                SELECT id, full_name, username, email, is_active, created_at,
                (SELECT COUNT(*) FROM conversations WHERE user_id = users.id AND is_deleted = FALSE) as conversation_count
                FROM users
                WHERE role = %s AND is_active = TRUE
                ORDER BY created_at DESC
            """, (role,))
            users = cursor.fetchall()
            cursor.close()
            return users
        except Exception as e:
            print(f"[MySQL] Error getting users by role: {e}")
            return []
    
    def get_user_by_id(self, user_id):
        """Get user information by ID"""
        try:
            cursor = self.connection.cursor(dictionary=True)
            cursor.execute(
                "SELECT id, full_name, username, email, created_at FROM users WHERE id = %s",
                (user_id,)
            )
            user = cursor.fetchone()
            cursor.close()
            return user
        except Exception as e:
            print(f"[MySQL] Error getting user: {e}")
            return None
    
    def generate_api_key(self, email, role='user'):
        """Generate a unique 16-character API key for an email"""
        import secrets
        import string
        
        try:
            cursor = self.connection.cursor(dictionary=True)
            
            # Check if email already has an API key
            cursor.execute("SELECT id FROM api_keys WHERE email = %s", (email,))
            if cursor.fetchone():
                cursor.close()
                return None, "Email already has an API key"
            
            # Generate unique API key
            characters = string.ascii_uppercase + string.digits
            while True:
                api_key = ''.join(secrets.choice(characters) for _ in range(16))
                cursor.execute("SELECT id FROM api_keys WHERE api_key = %s", (api_key,))
                if not cursor.fetchone():
                    break
            
            # Insert API key
            cursor.execute(
                "INSERT INTO api_keys (email, api_key, role) VALUES (%s, %s, %s)",
                (email, api_key, role)
            )
            self.connection.commit()
            cursor.close()
            return api_key, None
        except Exception as e:
            print(f"[MySQL] Error generating API key: {e}")
            return None, str(e)
    
    def get_all_api_keys(self):
        """Get all API keys"""
        try:
            cursor = self.connection.cursor(dictionary=True)
            cursor.execute("""
                SELECT id, email, api_key, is_used, 
                       COALESCE(role, 'user') as role, created_at
                FROM api_keys
                ORDER BY created_at DESC
            """)
            keys = cursor.fetchall()
            cursor.close()
            return keys
        except Exception as e:
            print(f"[MySQL] Error getting API keys: {e}")
            return []
    
    def delete_user(self, user_id):
        """Delete a user and all associated data"""
        try:
            cursor = self.connection.cursor()
            cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"[MySQL] Error deleting user: {e}")
            return False
    
    def toggle_user_status(self, user_id):
        """Toggle user active/inactive status"""
        try:
            cursor = self.connection.cursor()
            # Get current status
            cursor.execute("SELECT is_active FROM users WHERE id = %s", (user_id,))
            row = cursor.fetchone()
            if not row:
                cursor.close()
                return False, "User not found"
            
            current_status = row[0]
            new_status = not current_status
            
            # Update status
            cursor.execute("UPDATE users SET is_active = %s WHERE id = %s", (new_status, user_id))
            self.connection.commit()
            cursor.close()
            return True, new_status
        except Exception as e:
            print(f"[MySQL] Error toggling user status: {e}")
            return False, str(e)
    
    def verify_admin_by_id(self, admin_id):
        """Verify admin by ID and return admin info"""
        try:
            cursor = self.connection.cursor(dictionary=True)
            cursor.execute(
                "SELECT id, username, password_hash FROM admin WHERE id = %s",
                (admin_id,)
            )
            admin = cursor.fetchone()
            cursor.close()
            return admin
        except Exception as e:
            print(f"[MySQL] Error verifying admin by ID: {e}")
            return None
    
    def update_admin_password(self, admin_id, new_password_hash):
        """Update admin password"""
        try:
            cursor = self.connection.cursor()
            cursor.execute(
                "UPDATE admin SET password_hash = %s WHERE id = %s",
                (new_password_hash, admin_id)
            )
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"[MySQL] Error updating admin password: {e}")
            return False
    
    def delete_api_key(self, key_id):
        """Delete an API key"""
        try:
            cursor = self.connection.cursor()
            cursor.execute("DELETE FROM api_keys WHERE id = %s", (key_id,))
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"[MySQL] Error deleting API key: {e}")
            return False
    
    def close(self):
        if self.connection:
            self.connection.close()
