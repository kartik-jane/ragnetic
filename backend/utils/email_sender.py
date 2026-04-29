import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()


class EmailSender:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", 587))
        self.smtp_username = os.getenv("SMTP_USERNAME", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.from_email = os.getenv("SMTP_FROM_EMAIL", self.smtp_username)
        self.from_name = os.getenv("SMTP_FROM_NAME", "RAGnetic AI")

    def send_email(self, to_email, subject, html_body):
        """Send an email with HTML content"""
        if not all([self.smtp_username, self.smtp_password]):
            print("[Email] SMTP credentials not configured. Skipping email.")
            return False

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = to_email

            html_part = MIMEText(html_body, "html")
            msg.attach(html_part)

            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            print(f"[Email] Successfully sent email to {to_email}")
            return True
        except Exception as e:
            print(f"[Email] Error sending email: {str(e)}")
            return False

    def send_api_key_email(self, to_email, api_key):
        """Send API key to user via email"""
        subject = "Your RAGnetic AI API Key"
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .api-key-box {{ background: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }}
        .api-key {{ font-family: 'Courier New', monospace; font-size: 16px; color: #667eea; font-weight: bold; word-break: break-all; }}
        .warning {{ background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }}
        .footer {{ text-align: center; color: #666; margin-top: 30px; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to RAGnetic AI</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>Your API key has been generated successfully. Use this key to register your account on the RAGnetic AI platform.</p>
            
            <div class="api-key-box">
                <h3 style="margin-top: 0; color: #667eea;">Your API Key</h3>
                <div class="api-key">{api_key}</div>
            </div>

            <div class="warning">
                <strong>Important Security Notes:</strong>
                <ul>
                    <li>Keep this API key secure and confidential</li>
                    <li>Do not share it with anyone</li>
                    <li>This key is required for registration</li>
                </ul>
            </div>

            <h3>Next Steps:</h3>
            <ol>
                <li>Visit the RAGnetic AI registration page</li>
                <li>Fill in your details</li>
                <li>Enter the API key provided above</li>
                <li>Complete your registration</li>
            </ol>
        </div>
        <div class="footer">
            <p>© 2025 RAGnetic AI. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
"""
        return self.send_email(to_email, subject, html_body)

    def send_registration_success_email(self, to_email, full_name, username):
        """Send registration success confirmation email"""
        subject = "Welcome to RAGnetic AI - Registration Successful"
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .info-box {{ background: #fff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; }}
        .feature {{ background: #fff; padding: 15px; margin: 10px 0; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        .footer {{ text-align: center; color: #666; margin-top: 30px; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to RAGnetic AI</h1>
            <p>Your registration is complete</p>
        </div>
        <div class="content">
            <p>Hello <strong>{full_name}</strong>,</p>
            <p>Your account has been successfully created on the RAGnetic AI platform.</p>
            
            <div class="info-box">
                <h3 style="margin-top: 0; color: #667eea;">Account Details</h3>
                <p><strong>Username:</strong> {username}</p>
                <p><strong>Email:</strong> {to_email}</p>
            </div>

            <h3>What You Can Do:</h3>
            <div class="feature">
                <strong>Ask Questions</strong><br>
                Chat with our AI powered by your uploaded documents
            </div>
            <div class="feature">
                <strong>Upload Files</strong><br>
                Upload PDFs, text files, and documents for AI analysis
            </div>
            <div class="feature">
                <strong>Save Conversations</strong><br>
                All your chat history is automatically saved
            </div>
            <div class="feature">
                <strong>Get Accurate Answers</strong><br>
                Retrieve information from your knowledge base instantly
            </div>

            <h3>Getting Started:</h3>
            <ol>
                <li>Log in with your username and password</li>
                <li>Start a new conversation</li>
                <li>Ask questions or upload files to analyze</li>
                <li>Explore the power of RAG-based AI</li>
            </ol>
        </div>
        <div class="footer">
            <p>© 2025 RAGnetic AI. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>If you didn't create this account, please contact support.</p>
        </div>
    </div>
</body>
</html>
"""
        return self.send_email(to_email, subject, html_body)
