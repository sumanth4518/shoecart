import os
import smtplib
import email.utils
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

class EmailService:
    """Handles sending OTP emails and notifications with customizable HTML templates, anti-spam RFC headers, and console fallback."""

    @staticmethod
    def get_template_html(otp_code: str, purpose: str = "registration") -> str:
        """Loads and populates the customizable HTML email template."""
        if purpose == "password_reset":
            headline = "Password Reset Verification"
            message = "We received a request to reset your AURA KICKS account password. Enter the code below to set a new password."
            subject = f"[Aura Kicks] Password Reset Code: {otp_code}"
        else:
            headline = "Verify Your Account"
            message = "Thank you for joining AURA KICKS. Please enter this 6-digit verification code to activate your account:"
            subject = f"[Aura Kicks] Your Verification Code: {otp_code}"

        # 1. Check for custom template file in backend/templates/otp_email.html
        template_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../templates/otp_email.html"))
        if os.path.exists(template_path):
            try:
                with open(template_path, "r", encoding="utf-8") as f:
                    content = f.read()
                return content.replace("{{subject}}", subject)\
                              .replace("{{headline}}", headline)\
                              .replace("{{message}}", message)\
                              .replace("{{otp_code}}", otp_code)\
                              .replace("{{expiry_minutes}}", str(settings.OTP_EXPIRY_MINUTES))
            except Exception as e:
                print(f"[Email Template Warning] Could not read template file: {e}. Falling back to default.")

        # 2. Default Built-in Luxury HTML Template
        return f"""
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background-color: #090909; color: #ffffff; padding: 30px; border-radius: 14px; border: 1px solid #222222;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #FF6B1A; margin: 0; font-size: 24px; text-transform: uppercase;">AURA<span style="color: #ffffff;">KICKS</span></h2>
                <p style="color: #737373; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-top: 5px;">Footwear Authentication</p>
            </div>
            <h3 style="color: #ffffff; font-size: 18px; text-align: center; margin-bottom: 10px;">{headline}</h3>
            <p style="color: #a3a3a3; font-size: 14px; text-align: center; line-height: 1.5;">{message}</p>
            <div style="background-color: #141414; border: 2px solid #FF6B1A; border-radius: 10px; padding: 18px; text-align: center; margin: 25px 0;">
                <span style="font-family: monospace; font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #FF6B1A;">{otp_code}</span>
            </div>
            <p style="color: #737373; font-size: 12px; text-align: center; line-height: 1.4;">
                This single-use code expires in <strong>{settings.OTP_EXPIRY_MINUTES} minutes</strong>.<br>
                For your security, never share this code with anyone.
            </p>
        </div>
        """

    @classmethod
    def send_otp_email(cls, to_email: str, otp_code: str, purpose: str = "registration") -> bool:
        subject = f"[Aura Kicks] Your Verification Code: {otp_code}" if purpose != "password_reset" else f"[Aura Kicks] Password Reset Code: {otp_code}"
        body_html = cls.get_template_html(otp_code, purpose)

        # Plain text fallback prevents Gmail/SpamAssassin HTML-only spam heuristic penalties
        action_name = "account verification" if purpose != "password_reset" else "password reset"
        plain_text = (
            f"AURA KICKS - {action_name.upper()}\n\n"
            f"Your single-use verification code is: {otp_code}\n\n"
            f"This code will expire in {settings.OTP_EXPIRY_MINUTES} minutes.\n"
            f"If you did not request this verification code, please ignore this email.\n\n"
            f"--\nAURA KICKS Security Team\nsupport@aurakicks.com"
        )

        # Always log OTP prominently to console for instant debugging
        print(f"\n=======================================================")
        print(f"📧 [OTP DISPATCH] To: {to_email} | Purpose: {purpose}")
        print(f"🔑 VERIFICATION CODE: {otp_code}")
        print(f"=======================================================\n")

        # Sanitize SMTP credentials (stripping surrounding quotes and internal spaces in app passwords)
        clean_user = settings.EMAIL_USER.strip("\"' \t\n") if settings.EMAIL_USER else ""
        clean_password = settings.EMAIL_PASSWORD.strip("\"' \t\n").replace(" ", "") if settings.EMAIL_PASSWORD else ""
        clean_from_email = settings.EMAIL_FROM.strip("\"' \t\n") if settings.EMAIL_FROM else (clean_user or "noreply@aurakicks.com")
        
        # Format friendly sender name e.g. "Aura Kicks <user@gmail.com>"
        formatted_from = f'"Aura Kicks" <{clean_from_email}>' if "<" not in clean_from_email else clean_from_email

        # Send via SMTP if configured
        if clean_user and clean_password:
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = formatted_from
                msg["To"] = to_email
                msg["Reply-To"] = clean_from_email
                msg["Date"] = email.utils.formatdate(localtime=True)
                msg["Message-ID"] = email.utils.make_msgid(domain="gmail.com")
                msg["X-Mailer"] = "AuraKicks-Auth/2.0"
                msg["Auto-Submitted"] = "auto-generated"

                # Attach plain text FIRST, then HTML second (RFC standard for multipart/alternative)
                msg.attach(MIMEText(plain_text, "plain", "utf-8"))
                msg.attach(MIMEText(body_html, "html", "utf-8"))

                with smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT, timeout=10) as server:
                    server.starttls()
                    server.login(clean_user, clean_password)
                    server.sendmail(clean_from_email, to_email, msg.as_string())
                print(f"✅ [SMTP SUCCESS] OTP email delivered to {to_email}")
                return True
            except Exception as e:
                print(f"[Email Error] Failed to send via SMTP to {to_email}: {e}. OTP logged to console above.")
                return False
        else:
            print("⚠️ [Email Notice] SMTP credentials not configured. Code logged in console above.")
            return False

    @classmethod
    def dispatch_otp_background(cls, to_email: str, otp_code: str, purpose: str = "registration"):
        """Asynchronously dispatches the OTP in a background daemon thread so HTTP response returns instantly with zero UI lag."""
        import threading
        thread = threading.Thread(
            target=cls.send_otp_email,
            args=(to_email, otp_code, purpose),
            daemon=True
        )
        thread.start()

email_service = EmailService()
