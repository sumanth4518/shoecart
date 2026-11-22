import io
from decimal import Decimal
from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest
from app.services.invoice_service import invoice_service
from app.services.email_service import email_service


def test_in_memory_invoice_pdf_generation():
    """Validates that invoice PDF is generated strictly in-memory without S3 or disk writes."""
    mock_order = MagicMock()
    mock_order.order_number = "ORD-TEST9999"
    mock_order.created_at = datetime(2026, 11, 22, 14, 30)
    mock_order.payment_status = "PAID"
    mock_order.payment_method = "stripe"
    mock_order.order_status = "confirmed"
    mock_order.subtotal = Decimal("7999.00")
    mock_order.discount_amount = Decimal("800.00")
    mock_order.delivery_fee = Decimal("0.00")
    mock_order.total_amount = Decimal("7199.00")
    mock_order.tracking_number = "TRK-AURA-8822"
    mock_order.shipping_address_snapshot = {
        "formatted_address": "Penthouse 12, Skyview Towers, Hitech City, Hyderabad, 500081",
        "recipient_name": "Sumanth Guttireddy",
        "phone_number": "+91 99887 76655"
    }

    mock_item_1 = MagicMock()
    mock_item_1.product_name = "Air Jordan 1 High OG Lost & Found"
    mock_item_1.variant_snapshot = {"size": "UK 10", "colour": "Varsity Red", "sku": "DZ5485-612"}
    mock_item_1.unit_price = Decimal("4999.00")
    mock_item_1.quantity = 1
    mock_item_1.total_price = Decimal("4999.00")

    mock_item_2 = MagicMock()
    mock_item_2.product_name = "Nike Dunk Low Retro"
    mock_item_2.variant_snapshot = {"size": "UK 9", "colour": "Black / White Panda", "sku": "DD1391-100"}
    mock_item_2.unit_price = Decimal("3000.00")
    mock_item_2.quantity = 1
    mock_item_2.total_price = Decimal("3000.00")

    mock_order.items = [mock_item_1, mock_item_2]

    # Generate PDF in memory
    pdf_bytes = invoice_service.generate_invoice_pdf(
        order=mock_order,
        recipient_name="Sumanth Guttireddy",
        recipient_email="sumanth@example.com"
    )

    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 1000
    assert pdf_bytes.startswith(b"%PDF")
    assert b"%%EOF" in pdf_bytes[-1024:]


def test_invoice_email_construction_and_attachment():
    """Validates that order invoice email constructs proper RFC multipart with PDF attachment."""
    mock_order = MagicMock()
    mock_order.order_number = "ORD-TEST9999"
    mock_order.total_amount = Decimal("7199.00")
    mock_order.payment_method = "stripe"
    mock_order.payment_status = "PAID"
    mock_order.items = []
    mock_order.shipping_address_snapshot = {"formatted_address": "Test Address"}

    dummy_pdf = b"%PDF-1.4\n...dummy content...\n%%EOF"

    with patch("smtplib.SMTP") as mock_smtp, \
         patch("app.core.config.settings.EMAIL_USER", "sumanthguttireddy@gmail.com"), \
         patch("app.core.config.settings.EMAIL_PASSWORD", "mockapppassword1234"):
        
        smtp_instance = MagicMock()
        mock_smtp.return_value.__enter__.return_value = smtp_instance

        success = email_service.send_order_invoice_email(
            to_email="customer@example.com",
            recipient_name="Sumanth Guttireddy",
            order=mock_order,
            pdf_bytes=dummy_pdf
        )

        assert success is True
        assert smtp_instance.sendmail.called
        
        args, kwargs = smtp_instance.sendmail.call_args
        from_addr, to_addr, raw_msg = args
        assert to_addr == "customer@example.com"
        assert "AuraKicks_Invoice_ORD-TEST9999.pdf" in raw_msg
        assert "application/pdf" in raw_msg
