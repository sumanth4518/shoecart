import os
import smtplib
import email.utils
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
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
    def _execute_smtp_send(cls, clean_user: str, clean_password: str, sender: str, recipient: str, msg_string: str) -> bool:
        """
        Sends an email payload using smtplib with dual-port fallback (Port 587 STARTTLS & Port 465 SSL).
        Automatically adapts to cloud firewalls on Render/AWS.
        """
        import ssl
        configured_port = int(settings.EMAIL_PORT) if settings.EMAIL_PORT else 587
        ports_to_try = [configured_port]
        if configured_port == 587 and 465 not in ports_to_try:
            ports_to_try.append(465)
        elif configured_port == 465 and 587 not in ports_to_try:
            ports_to_try.append(587)

        last_err = None
        for port in ports_to_try:
            try:
                if port == 465:
                    ssl_ctx = ssl.create_default_context()
                    with smtplib.SMTP_SSL(settings.EMAIL_HOST, 465, timeout=12, context=ssl_ctx) as server:
                        server.login(clean_user, clean_password)
                        server.sendmail(sender, recipient, msg_string)
                        print(f"✅ [SMTP SUCCESS] Delivered via SSL (port 465) to {recipient}")
                        return True
                else:
                    with smtplib.SMTP(settings.EMAIL_HOST, port, timeout=12) as server:
                        server.starttls()
                        server.login(clean_user, clean_password)
                        server.sendmail(sender, recipient, msg_string)
                        print(f"✅ [SMTP SUCCESS] Delivered via STARTTLS (port {port}) to {recipient}")
                        return True
            except Exception as err:
                last_err = err
                print(f"⚠️ [SMTP Attempt Notice] Delivery attempt failed on {settings.EMAIL_HOST}:{port}: {err}")

        raise last_err or Exception("All SMTP ports failed.")

    @classmethod
    def test_smtp_connection(cls, test_recipient: str = None) -> dict:
        """
        Tests the SMTP server connection, STARTTLS / SSL handshake, and authentication.
        Optionally sends a small test ping email to test_recipient.
        """
        clean_user = settings.EMAIL_USER.strip("\"' \t\n") if settings.EMAIL_USER else ""
        clean_password = settings.EMAIL_PASSWORD.strip("\"' \t\n").replace(" ", "") if settings.EMAIL_PASSWORD else ""
        clean_from_email = settings.EMAIL_FROM.strip("\"' \t\n") if settings.EMAIL_FROM else (clean_user or "noreply@aurakicks.com")
        if ("gmail" in settings.EMAIL_HOST.lower() or "gmail" in clean_user.lower()) and ("aurakicks.com" in clean_from_email or not clean_from_email):
            clean_from_email = clean_user

        if not clean_user or not clean_password:
            return {
                "configured": False,
                "error": "EMAIL_USER or EMAIL_PASSWORD environment variable is missing on the server. Please add them in the Render Dashboard under Environment tab.",
                "host": settings.EMAIL_HOST,
                "port": settings.EMAIL_PORT,
                "user": clean_user or "NOT_SET",
                "from_email": clean_from_email
            }

        try:
            configured_port = int(settings.EMAIL_PORT) if settings.EMAIL_PORT else 587
            if configured_port == 465:
                import ssl
                ssl_ctx = ssl.create_default_context()
                server = smtplib.SMTP_SSL(settings.EMAIL_HOST, 465, timeout=10, context=ssl_ctx)
            else:
                server = smtplib.SMTP(settings.EMAIL_HOST, configured_port, timeout=10)
                server.starttls()

            server.login(clean_user, clean_password)

            email_sent = False
            if test_recipient:
                test_msg = MIMEText("This is an automated SMTP connection test from Aura Kicks.", "plain", "utf-8")
                test_msg["Subject"] = "[Aura Kicks] SMTP Diagnostic Test"
                test_msg["From"] = f'"Aura Kicks" <{clean_from_email}>'
                test_msg["To"] = test_recipient
                server.sendmail(clean_from_email, test_recipient, test_msg.as_string())
                email_sent = True

            server.quit()
            return {
                "configured": True,
                "status": "connected_and_authenticated",
                "host": settings.EMAIL_HOST,
                "port": configured_port,
                "user": clean_user,
                "from_email": clean_from_email,
                "test_email_sent_to": test_recipient if email_sent else None,
                "message": "SMTP connection and credentials verified successfully."
            }
        except Exception as err:
            return {
                "configured": True,
                "status": "failed",
                "host": settings.EMAIL_HOST,
                "port": settings.EMAIL_PORT,
                "user": clean_user,
                "from_email": clean_from_email,
                "error": str(err)
            }

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
        
        # If sending via Gmail SMTP, ensure sender matches the authenticated user to satisfy Gmail SPF/policy
        if ("gmail" in settings.EMAIL_HOST.lower() or "gmail" in clean_user.lower()) and ("aurakicks.com" in clean_from_email or not clean_from_email):
            clean_from_email = clean_user

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

                cls._execute_smtp_send(clean_user, clean_password, clean_from_email, to_email, msg.as_string())
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

    @staticmethod
    def extract_order_data(order: any) -> dict:
        """Safely flattens an Order model or dictionary into pure Python primitives for thread-safe background dispatch."""
        if isinstance(order, dict):
            return order

        order_number = str(getattr(order, "order_number", "ORD-UNKNOWN"))
        total_amount = float(getattr(order, "total_amount", 0.0))
        payment_method = str(getattr(order, "payment_method", "COD")).upper()
        payment_status = str(getattr(order, "payment_status", "CONFIRMED")).upper()

        addr_snap = getattr(order, "shipping_address_snapshot", {}) or {}
        if isinstance(addr_snap, dict):
            delivery_addr = addr_snap.get("formatted_address") or addr_snap.get("address") or "Standard Delivery Address"
        else:
            delivery_addr = str(addr_snap)

        items_list = []
        try:
            raw_items = getattr(order, "items", []) or []
            for item in raw_items:
                p_name = getattr(item, "product_name", "Footwear")
                variant_snap = getattr(item, "variant_snapshot", {}) or {}
                size = variant_snap.get("size") if isinstance(variant_snap, dict) else (
                    item.variant.size if getattr(item, "variant", None) else "Standard"
                )
                qty = int(getattr(item, "quantity", 1))
                price = float(getattr(item, "unit_price", 0.0))
                tot = float(getattr(item, "total_price", price * qty))
                items_list.append({
                    "name": p_name,
                    "size": size,
                    "quantity": qty,
                    "price": price,
                    "total": tot
                })
        except Exception:
            pass

        return {
            "order_number": order_number,
            "total_amount": total_amount,
            "payment_method": payment_method,
            "payment_status": payment_status,
            "delivery_address": delivery_addr,
            "items": items_list
        }

    @classmethod
    def get_invoice_template_html(cls, recipient_name: str, order: any) -> str:
        """Loads and populates a luxury HTML email for footwear order confirmation with PDF invoice notification."""
        data = cls.extract_order_data(order)
        order_number = data["order_number"]
        total_amount = data["total_amount"]
        payment_method = data["payment_method"]
        payment_status = data["payment_status"]
        delivery_addr = data["delivery_address"]

        # Build items table rows
        items_rows = ""
        items = data.get("items", [])
        if items:
            for item in items:
                p_name = item.get("name", "Footwear")
                size = item.get("size", "Standard")
                qty = item.get("quantity", 1)
                tot = item.get("total", 0.0)

                items_rows += f"""
                <tr style="border-bottom: 1px solid #222222;">
                    <td style="padding: 12px 8px; color: #ffffff; font-size: 14px;">
                        <strong>{p_name}</strong><br/>
                        <span style="color: #FF6B1A; font-size: 12px;">Size: {size}</span>
                    </td>
                    <td style="padding: 12px 8px; color: #a3a3a3; font-size: 14px; text-align: center;">{qty}</td>
                    <td style="padding: 12px 8px; color: #ffffff; font-size: 14px; text-align: right;">&#8377; {tot:,.2f}</td>
                </tr>
                """
        else:
            items_rows = f"""
            <tr style="border-bottom: 1px solid #222222;">
                <td style="padding: 12px 8px; color: #ffffff; font-size: 14px;">
                    <strong>Aura Kicks Luxury Footwear Order</strong><br/>
                    <span style="color: #FF6B1A; font-size: 12px;">Verified Order</span>
                </td>
                <td style="padding: 12px 8px; color: #a3a3a3; font-size: 14px; text-align: center;">1</td>
                <td style="padding: 12px 8px; color: #ffffff; font-size: 14px; text-align: right;">&#8377; {total_amount:,.2f}</td>
            </tr>
            """

        return f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #090909; color: #ffffff; padding: 32px; border-radius: 14px; border: 1px solid #222222;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #FF6B1A; margin: 0; font-size: 28px; letter-spacing: 2px; text-transform: uppercase;">
                    AURA<span style="color: #ffffff;">KICKS</span>
                </h1>
                <p style="color: #737373; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; margin-top: 4px;">
                    Order Confirmation &bull; Tax Invoice
                </p>
            </div>

            <div style="background-color: #141414; border-left: 4px solid #FF6B1A; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
                <h2 style="color: #ffffff; font-size: 18px; margin: 0 0 6px 0;">Thank You for Your Order, {recipient_name}!</h2>
                <p style="color: #a3a3a3; font-size: 13px; margin: 0; line-height: 1.5;">
                    Your footwear order has been verified and confirmed. Your official tax invoice PDF is attached to this email.
                </p>
            </div>

            <div style="background-color: #121212; border: 1px solid #262626; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="color: #737373; font-size: 12px; padding-bottom: 4px;">ORDER NUMBER</td>
                        <td style="color: #737373; font-size: 12px; padding-bottom: 4px; text-align: right;">PAYMENT METHOD</td>
                    </tr>
                    <tr>
                        <td style="color: #FF6B1A; font-family: monospace; font-size: 16px; font-weight: bold;">{order_number}</td>
                        <td style="color: #ffffff; font-size: 14px; font-weight: bold; text-align: right;">{payment_method} ({payment_status})</td>
                    </tr>
                </table>
            </div>

            <h3 style="color: #ffffff; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; border-bottom: 1px solid #222222; padding-bottom: 6px;">
                Item Summary
            </h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                    <tr style="border-bottom: 1px solid #333333; color: #737373; font-size: 11px; text-transform: uppercase;">
                        <th style="padding: 6px 8px; text-align: left;">Footwear</th>
                        <th style="padding: 6px 8px; text-align: center;">Qty</th>
                        <th style="padding: 6px 8px; text-align: right;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {items_rows}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="2" style="padding: 14px 8px 6px 8px; color: #a3a3a3; font-size: 14px; text-align: right;">Total Amount:</td>
                        <td style="padding: 14px 8px 6px 8px; color: #FF6B1A; font-size: 18px; font-weight: bold; text-align: right;">&#8377; {total_amount:,.2f}</td>
                    </tr>
                </tfoot>
            </table>

            <div style="background-color: #121212; border: 1px solid #262626; border-radius: 8px; padding: 14px; margin-bottom: 24px;">
                <p style="color: #737373; font-size: 11px; text-transform: uppercase; margin: 0 0 4px 0;">Delivery Address</p>
                <p style="color: #e5e5e5; font-size: 13px; margin: 0; line-height: 1.4;">{delivery_addr}</p>
            </div>

            <div style="border: 1px dashed #FF6B1A; background-color: #18120c; border-radius: 8px; padding: 14px; text-align: center; margin-bottom: 24px;">
                <p style="color: #FF6B1A; font-size: 13px; font-weight: bold; margin: 0 0 4px 0;">
                    &#128206; Tax Invoice PDF Attached
                </p>
                <p style="color: #a3a3a3; font-size: 12px; margin: 0;">
                    Please find attached <strong>AuraKicks_Invoice_{order_number}.pdf</strong> for your warranty, authenticity records, and returns.
                </p>
            </div>

            <p style="color: #525252; font-size: 11px; text-align: center; line-height: 1.5; margin: 0;">
                Aura Kicks Footwear Retail &bull; 100% Verified Authentic Footwear &bull; 7-Day Hassle-Free Returns<br/>
                For support, reach out to <a href="mailto:support@aurakicks.com" style="color: #FF6B1A; text-decoration: none;">support@aurakicks.com</a>
            </p>
        </div>
        """

    @classmethod
    def send_order_invoice_email(
        cls,
        to_email: str,
        recipient_name: str,
        order: any,
        pdf_bytes: bytes
    ) -> bool:
        """
        Sends an order confirmation email with the in-memory generated PDF invoice attached.
        The PDF is never stored on disk or in S3.
        """
        data = cls.extract_order_data(order)
        order_number = data["order_number"]
        total_amount = data["total_amount"]
        subject = f"[Aura Kicks] Invoice & Confirmation for Order {order_number}"
        body_html = cls.get_invoice_template_html(recipient_name, data)

        plain_text = (
            f"AURA KICKS - ORDER CONFIRMATION & TAX INVOICE\n\n"
            f"Dear {recipient_name},\n\n"
            f"Thank you for your footwear order with Aura Kicks!\n"
            f"Order Reference: {order_number}\n"
            f"Total Amount: INR {total_amount:,.2f}\n\n"
            f"Your official Tax Invoice has been generated in-memory and is attached as a PDF: AuraKicks_Invoice_{order_number}.pdf\n\n"
            f"If you have any questions or require an exchange/return within 7 days, please email us at support@aurakicks.com quoting your order number.\n\n"
            f"--\nAura Kicks Customer Care\nsupport@aurakicks.com\nhttps://aurakicks.com"
        )

        print(f"\n=======================================================")
        print(f"📧 [INVOICE DISPATCH] Order: {order_number} | To: {to_email}")
        print(f"📄 ATTACHMENT: AuraKicks_Invoice_{order_number}.pdf ({len(pdf_bytes)} bytes)")
        print(f"=======================================================\n")

        clean_user = settings.EMAIL_USER.strip("\"' \t\n") if settings.EMAIL_USER else ""
        clean_password = settings.EMAIL_PASSWORD.strip("\"' \t\n").replace(" ", "") if settings.EMAIL_PASSWORD else ""
        clean_from_email = settings.EMAIL_FROM.strip("\"' \t\n") if settings.EMAIL_FROM else (clean_user or "noreply@aurakicks.com")

        # If sending via Gmail SMTP, ensure sender matches the authenticated user to satisfy Gmail SPF/policy
        if ("gmail" in settings.EMAIL_HOST.lower() or "gmail" in clean_user.lower()) and ("aurakicks.com" in clean_from_email or not clean_from_email):
            clean_from_email = clean_user

        formatted_from = f'"Aura Kicks" <{clean_from_email}>' if "<" not in clean_from_email else clean_from_email

        if clean_user and clean_password:
            try:
                # Outer container for mixed content (body + attachments)
                msg = MIMEMultipart("mixed")
                msg["Subject"] = subject
                msg["From"] = formatted_from
                msg["To"] = to_email
                msg["Reply-To"] = clean_from_email
                msg["Date"] = email.utils.formatdate(localtime=True)
                msg["Message-ID"] = email.utils.make_msgid(domain="gmail.com")
                msg["X-Mailer"] = "AuraKicks-Invoice/2.0"
                msg["Auto-Submitted"] = "auto-generated"

                # Subpart for plain text / HTML alternative view
                alt_part = MIMEMultipart("alternative")
                alt_part.attach(MIMEText(plain_text, "plain", "utf-8"))
                alt_part.attach(MIMEText(body_html, "html", "utf-8"))
                msg.attach(alt_part)

                # Attach PDF in-memory buffer
                pdf_attachment = MIMEApplication(pdf_bytes, _subtype="pdf")
                pdf_filename = f"AuraKicks_Invoice_{order_number}.pdf"
                pdf_attachment.add_header(
                    "Content-Disposition",
                    "attachment",
                    filename=pdf_filename
                )
                msg.attach(pdf_attachment)

                cls._execute_smtp_send(clean_user, clean_password, clean_from_email, to_email, msg.as_string())

                print(f"✅ [SMTP SUCCESS] Order invoice PDF sent to {to_email} for order {order_number}")
                return True
            except Exception as e:
                print(f"[Email Error] Failed to send invoice via SMTP to {to_email}: {e}")
                return False
        else:
            print("⚠️ [Email Notice] SMTP credentials not configured. Invoice PDF generated in-memory but not emailed.")
            return False

    @classmethod
    def dispatch_order_invoice_background(
        cls,
        to_email: str,
        recipient_name: str,
        order: any,
        pdf_bytes: bytes
    ):
        """Dispatches invoice email in a non-blocking background daemon thread with pre-serialized data."""
        import threading
        flat_data = cls.extract_order_data(order)
        thread = threading.Thread(
            target=cls.send_order_invoice_email,
            args=(to_email, recipient_name, flat_data, pdf_bytes),
            daemon=True
        )
        thread.start()

email_service = EmailService()
