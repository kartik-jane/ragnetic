from flask import session

def require_auth():
    """Check if user is authenticated"""
    if 'user_id' not in session:
        return None
    return session['user_id']

def require_admin():
    """Check if admin is authenticated"""
    if 'admin_id' not in session:
        return None
    return session['admin_id']

def require_management():
    """Check if management is authenticated"""
    if 'management_id' not in session:
        return None
    return session['management_id']