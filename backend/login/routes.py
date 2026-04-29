from flask import Blueprint, request, jsonify, session
from db.sqlite_handler import SQLiteHandler
from utils.email_sender import EmailSender
from utils.auth import require_auth, require_admin, require_management
import bcrypt

# Create blueprint
login_bp = Blueprint('login', __name__)

# Initialize SQLite handler and email sender
db = SQLiteHandler()
email_sender = EmailSender()

@login_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.json
        full_name = data.get("full_name")
        username = data.get("username")
        email = data.get("email")
        password = data.get("password")
        api_key = data.get("api_key")
        role = data.get("role", "user")  # Default to user

        if not all([full_name, username, email, password, api_key]):
            return jsonify({"error": "All fields are required"}), 400

        if role not in ["user", "management"]:
            return jsonify({"error": "Invalid role"}), 400

        user_id, error = db.create_user(full_name, username, email, password, api_key, role)
        if user_id:
            # Send registration success email
            email_sender.send_registration_success_email(email, full_name, username)
            return jsonify({"message": "Registration successful"})
        else:
            return jsonify({"error": error or "Registration failed"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@login_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.json
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return jsonify({"error": "Username and password are required"}), 400

        user = db.verify_user(username, password)
        if user:
            if user['role'] == 'management':
                session['management_id'] = user['id']
                session['management_username'] = user['username']
                return jsonify({"message": "Management login successful", "user": user})
            else:
                session['user_id'] = user['id']
                session['username'] = user['username']
                return jsonify({"message": "Login successful", "user": user})
        else:
            return jsonify({"error": "Invalid username or password"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@login_bp.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logout successful"})

@login_bp.route("/check-auth", methods=["GET"])
def check_auth():
    user_id = require_auth()
    if user_id:
        user = db.get_user_by_id(user_id)
        return jsonify({"authenticated": True, "user": user, "role": user['role']})

    management_id = require_management()
    if management_id:
        user = db.get_user_by_id(management_id)
        return jsonify({"authenticated": True, "user": user, "role": "management"})

    return jsonify({"authenticated": False}), 401

@login_bp.route("/admin/login", methods=["POST"])
def admin_login():
    try:
        data = request.json
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return jsonify({"error": "Username and password are required"}), 400

        admin = db.verify_admin(username, password)
        if admin:
            session['admin_id'] = admin['id']
            session['admin_username'] = admin['username']
            return jsonify({"message": "Admin login successful", "admin": admin})
        else:
            return jsonify({"error": "Invalid admin credentials"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@login_bp.route("/admin/check-auth", methods=["GET"])
def admin_check_auth():
    admin_id = require_admin()
    if admin_id:
        return jsonify({"authenticated": True, "admin": {"id": admin_id, "username": session.get('admin_username')}, "role": "admin"})
    return jsonify({"authenticated": False}), 401

@login_bp.route("/admin/logout", methods=["POST"])
def admin_logout():
    session.clear()
    return jsonify({"message": "Admin logout successful"})

@login_bp.route("/profile", methods=["GET"])
def get_profile():
    user_id = require_auth()
    management_id = require_management()

    if not user_id and not management_id:
        return jsonify({"error": "Authentication required"}), 401

    try:
        user = db.get_user_by_id(user_id or management_id)
        if user:
            # Remove sensitive information
            user_data = {
                "id": user["id"],
                "full_name": user["full_name"],
                "username": user["username"],
                "email": user["email"],
                "role": user["role"],
                "created_at": user["created_at"]
            }
            return jsonify({"user": user_data})
        else:
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@login_bp.route("/profile", methods=["PUT"])
def update_profile():
    user_id = require_auth()
    management_id = require_management()

    if not user_id and not management_id:
        return jsonify({"error": "Authentication required"}), 401

    try:
        data = request.json
        current_user_id = user_id or management_id

        # Get current user data
        current_user = db.get_user_by_id(current_user_id)
        if not current_user:
            return jsonify({"error": "User not found"}), 404

        # Prepare update data
        update_data = {}

        if "full_name" in data:
            update_data["full_name"] = data["full_name"]
        if "username" in data:
            # Check if username is already taken by another user
            if data["username"] != current_user["username"]:
                existing_user = db.get_user_by_username(data["username"])
                if existing_user and existing_user["id"] != current_user_id:
                    return jsonify({"error": "Username already taken"}), 400
            update_data["username"] = data["username"]
        if "email" in data:
            # Check if email is already taken by another user
            if data["email"] != current_user["email"]:
                existing_user = db.get_user_by_email(data["email"])
                if existing_user and existing_user["id"] != current_user_id:
                    return jsonify({"error": "Email already taken"}), 400
            update_data["email"] = data["email"]
        if "password" in data and data["password"]:
            # Hash the new password
            update_data["password_hash"] = bcrypt.hashpw(data["password"].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        if not update_data:
            return jsonify({"error": "No valid fields to update"}), 400

        # Update user
        success = db.update_user(current_user_id, update_data)
        if success:
            # Get updated user data
            updated_user = db.get_user_by_id(current_user_id)
            user_data = {
                "id": updated_user["id"],
                "full_name": updated_user["full_name"],
                "username": updated_user["username"],
                "email": updated_user["email"],
                "role": updated_user["role"],
                "created_at": updated_user["created_at"]
            }
            return jsonify({"message": "Profile updated successfully", "user": user_data})
        else:
            return jsonify({"error": "Failed to update profile"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@login_bp.route("/admin/users", methods=["GET"])
def get_all_users():
    admin_id = require_admin()
    if not admin_id:
        return jsonify({"error": "Admin authentication required"}), 401

    try:
        users = db.get_users_by_role('user')
        return jsonify({"users": users})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@login_bp.route("/admin/management-users", methods=["GET"])
def get_management_users():
    admin_id = require_admin()
    if not admin_id:
        return jsonify({"error": "Admin authentication required"}), 401

    try:
        management_users = db.get_users_by_role('management')
        return jsonify({"management_users": management_users})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@login_bp.route("/admin/all-users", methods=["GET"])
def get_all_users_combined():
    admin_id = require_admin()
    if not admin_id:
        return jsonify({"error": "Admin authentication required"}), 401

    try:
        all_users = db.get_all_users()

        # Separate users by role
        users = [user for user in all_users if user['role'] == 'user']
        management_users = [user for user in all_users if user['role'] == 'management']

        return jsonify({
            "users": users,
            "management_users": management_users,
            "total_users": len(users),
            "total_management": len(management_users),
            "total_all": len(all_users)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@login_bp.route("/admin/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    admin_id = require_admin()
    if not admin_id:
        return jsonify({"error": "Admin authentication required"}), 401

    try:
        success = db.delete_user(user_id)
        if success:
            return jsonify({"message": "User deleted successfully"})
        else:
            return jsonify({"error": "Failed to delete user"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@login_bp.route("/admin/api-keys/generate", methods=["POST"])
def generate_api_key():
    admin_id = require_admin()
    if not admin_id:
        return jsonify({"error": "Admin authentication required"}), 401

    try:
        data = request.json
        email = data.get("email")
        role = data.get("role", "user")  # Default to user

        if not email:
            return jsonify({"error": "Email is required"}), 400

        if role not in ["user", "management"]:
            return jsonify({"error": "Invalid role"}), 400

        api_key, error = db.generate_api_key(email, role)
        if api_key:
            # Send API key via email
            email_sender.send_api_key_email(email, api_key)
            return jsonify({"api_key": api_key, "email": email, "role": role})
        else:
            return jsonify({"error": error or "Failed to generate API key"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@login_bp.route("/admin/api-keys", methods=["GET"])
def get_all_api_keys():
    admin_id = require_admin()
    if not admin_id:
        return jsonify({"error": "Admin authentication required"}), 401

    try:
        keys = db.get_all_api_keys()
        return jsonify({"api_keys": keys})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@login_bp.route("/admin/api-keys/<int:key_id>", methods=["DELETE"])
def delete_api_key(key_id):
    admin_id = require_admin()
    if not admin_id:
        return jsonify({"error": "Admin authentication required"}), 401

    try:
        success = db.delete_api_key(key_id)
        if success:
            return jsonify({"message": "API key deleted successfully"})
        else:
            return jsonify({"error": "Failed to delete API key"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@login_bp.route("/admin/toggle-user/<int:user_id>", methods=["POST"])
def toggle_user_status(user_id):
    admin_id = require_admin()
    if not admin_id:
        return jsonify({"error": "Admin authentication required"}), 401

    try:
        success, new_status = db.toggle_user_status(user_id)
        if success:
            status_text = "activated" if new_status == 1 else "deactivated"
            return jsonify({"message": f"User {status_text} successfully", "new_status": new_status})
        else:
            return jsonify({"error": new_status}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@login_bp.route("/admin/change-password", methods=["POST"])
def change_admin_password():
    admin_id = require_admin()
    if not admin_id:
        return jsonify({"error": "Admin authentication required"}), 401

    try:
        data = request.json
        current_password = data.get("current_password")
        new_password = data.get("new_password")

        if not current_password or not new_password:
            return jsonify({"error": "Current password and new password are required"}), 400

        # Verify current password
        admin = db.verify_admin_by_id(admin_id)
        if not admin or not bcrypt.checkpw(current_password.encode('utf-8'), admin['password_hash'].encode('utf-8')):
            return jsonify({"error": "Current password is incorrect"}), 400

        # Hash new password
        new_password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Update password
        success = db.update_admin_password(admin_id, new_password_hash)
        if success:
            return jsonify({"message": "Password changed successfully"})
        else:
            return jsonify({"error": "Failed to change password"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500