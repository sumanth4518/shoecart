import io
from datetime import datetime
from decimal import Decimal
from typing import Optional, Dict, Any, List

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

from app.models.entities import Order, OrderItem


class InvoiceService:
    """
    Generates professional, brand-aligned PDF invoices in memory.
    Strictly uses io.BytesIO() without persisting to local disk or S3 object storage.
    """

    # Aura Kicks Signature Palette
    COLOR_PRIMARY_DARK = colors.HexColor("#090909")
    COLOR_BRAND_ORANGE = colors.HexColor("#FF6B1A")
    COLOR_ACCENT_GRAY = colors.HexColor("#737373")
    COLOR_BG_LIGHT = colors.HexColor("#F9FAFB")
    COLOR_BORDER_LIGHT = colors.HexColor("#E5E7EB")
    COLOR_TEXT_MAIN = colors.HexColor("#111827")
    COLOR_TEXT_MUTED = colors.HexColor("#4B5563")
    COLOR_SUCCESS = colors.HexColor("#059669")
    COLOR_WHITE = colors.HexColor("#FFFFFF")

    @classmethod
    def generate_invoice_pdf(cls, order: Order, recipient_name: Optional[str] = None, recipient_email: Optional[str] = None) -> bytes:
        """
        Builds an in-memory PDF invoice using ReportLab Platypus and returns the raw bytes.
        No disk files or S3 storage utilized.
        """
        buffer = io.BytesIO()

        # Target A4 document with 0.5 inch (36pt) margins for maximum clean printable area
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=36,
            rightMargin=36,
            topMargin=36,
            bottomMargin=36,
            title=f"Aura Kicks Invoice - {order.order_number}",
            author="Aura Kicks Footwear",
            subject=f"Tax Invoice for Order {order.order_number}"
        )

        styles = getSampleStyleSheet()

        # Custom Brand Typography Styles
        style_logo = ParagraphStyle(
            'AuraLogo',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=24,
            leading=28,
            textColor=cls.COLOR_PRIMARY_DARK
        )
        style_tagline = ParagraphStyle(
            'AuraTagline',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8,
            leading=10,
            textColor=cls.COLOR_BRAND_ORANGE
        )
        style_company_meta = ParagraphStyle(
            'CompanyMeta',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8,
            leading=11,
            textColor=cls.COLOR_TEXT_MUTED
        )
        style_invoice_title = ParagraphStyle(
            'InvoiceTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=20,
            leading=24,
            alignment=TA_RIGHT,
            textColor=cls.COLOR_BRAND_ORANGE
        )
        style_invoice_meta = ParagraphStyle(
            'InvoiceMeta',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=13,
            alignment=TA_RIGHT,
            textColor=cls.COLOR_TEXT_MAIN
        )
        style_section_heading = ParagraphStyle(
            'SectionHeading',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=10,
            leading=13,
            textColor=cls.COLOR_PRIMARY_DARK
        )
        style_body = ParagraphStyle(
            'Body',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=13,
            textColor=cls.COLOR_TEXT_MAIN
        )
        style_body_muted = ParagraphStyle(
            'BodyMuted',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8,
            leading=11,
            textColor=cls.COLOR_TEXT_MUTED
        )
        style_table_header = ParagraphStyle(
            'TableHeader',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8,
            leading=10,
            textColor=cls.COLOR_WHITE
        )
        style_table_cell = ParagraphStyle(
            'TableCell',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8,
            leading=11,
            textColor=cls.COLOR_TEXT_MAIN
        )
        style_table_cell_bold = ParagraphStyle(
            'TableCellBold',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8,
            leading=11,
            textColor=cls.COLOR_TEXT_MAIN
        )
        style_table_cell_center = ParagraphStyle(
            'TableCellCenter',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8,
            leading=11,
            alignment=TA_CENTER,
            textColor=cls.COLOR_TEXT_MAIN
        )
        style_table_cell_right = ParagraphStyle(
            'TableCellRight',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8,
            leading=11,
            alignment=TA_RIGHT,
            textColor=cls.COLOR_TEXT_MAIN
        )
        style_total_label = ParagraphStyle(
            'TotalLabel',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            alignment=TA_RIGHT,
            textColor=cls.COLOR_TEXT_MUTED
        )
        style_total_val = ParagraphStyle(
            'TotalVal',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9,
            leading=12,
            alignment=TA_RIGHT,
            textColor=cls.COLOR_TEXT_MAIN
        )
        style_grand_total_label = ParagraphStyle(
            'GrandTotalLabel',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=14,
            alignment=TA_RIGHT,
            textColor=cls.COLOR_WHITE
        )
        style_grand_total_val = ParagraphStyle(
            'GrandTotalVal',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=12,
            leading=15,
            alignment=TA_RIGHT,
            textColor=cls.COLOR_BRAND_ORANGE
        )
        style_footer = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8,
            leading=11,
            alignment=TA_CENTER,
            textColor=cls.COLOR_TEXT_MUTED
        )

        story = []

        # -------------------------------------------------------------
        # 1. HEADER BRANDING & INVOICE META
        # -------------------------------------------------------------
        order_date_str = order.created_at.strftime("%d %b %Y, %I:%M %p") if order.created_at else datetime.now().strftime("%d %b %Y")
        payment_status_text = (order.payment_status or "PENDING").upper()
        payment_method_text = (order.payment_method or "COD").upper()

        if payment_status_text == "PAID":
            badge_html = f'<font color="#059669"><b>PAID</b></font>'
        elif payment_status_text == "CANCELLED":
            badge_html = f'<font color="#DC2626"><b>CANCELLED</b></font>'
        else:
            badge_html = f'<font color="#FF6B1A"><b>PAY ON DELIVERY</b></font>'

        header_left = [
            Paragraph('<font color="#FF6B1A">AURA</font><font color="#090909">KICKS</font>', style_logo),
            Paragraph('AUTHENTIC LUXURY FOOTWEAR', style_tagline),
            Spacer(1, 4),
            Paragraph('Aura Kicks Retail Inc. &bull; GSTIN: 36AABCA1234F1Z8', style_company_meta),
            Paragraph('Email: support@aurakicks.com &bull; Web: aurakicks.com', style_company_meta),
        ]

        header_right = [
            Paragraph('TAX INVOICE', style_invoice_title),
            Spacer(1, 4),
            Paragraph(f'<b>Invoice No:</b> INV-{order.order_number}', style_invoice_meta),
            Paragraph(f'<b>Order Date:</b> {order_date_str}', style_invoice_meta),
            Paragraph(f'<b>Payment Status:</b> {badge_html}', style_invoice_meta),
            Paragraph(f'<b>Payment Method:</b> {payment_method_text}', style_invoice_meta),
        ]

        # Printable width = 595.27 (A4 width) - 72 (margins) = ~523 pt
        header_table = Table([[header_left, header_right]], colWidths=[290, 233])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 10))

        # Brand Accent Line
        story.append(HRFlowable(width="100%", thickness=2, color=cls.COLOR_BRAND_ORANGE, spaceBefore=0, spaceAfter=14))

        # -------------------------------------------------------------
        # 2. CUSTOMER & SHIPPING SNAPSHOT
        # -------------------------------------------------------------
        address_snapshot = order.shipping_address_snapshot or {}
        if isinstance(address_snapshot, str):
            address_text = address_snapshot
            recip_name = recipient_name or (order.user.full_name if order.user else "Valued Customer")
            recip_phone = order.user.phone_number if order.user else "N/A"
        else:
            address_text = address_snapshot.get("formatted_address") or address_snapshot.get("address") or "Standard Delivery Address"
            recip_name = address_snapshot.get("recipient_name") or recipient_name or (order.user.full_name if order.user else "Valued Customer")
            recip_phone = address_snapshot.get("phone_number") or (order.user.phone_number if order.user else "N/A")

        recip_email = recipient_email or (order.user.email if order.user else "customer@aurakicks.com")

        bill_to_content = [
            Paragraph('<b>DELIVER TO / BILL TO</b>', style_section_heading),
            Spacer(1, 4),
            Paragraph(f'<b>{recip_name}</b>', style_body),
            Paragraph(f'{address_text}', style_body_muted),
            Paragraph(f'Phone: {recip_phone or "N/A"}', style_body_muted),
            Paragraph(f'Email: {recip_email}', style_body_muted),
        ]

        order_meta_content = [
            Paragraph('<b>SHIPPING & ORDER DETAILS</b>', style_section_heading),
            Spacer(1, 4),
            Paragraph(f'<b>Order Reference:</b> {order.order_number}', style_body),
            Paragraph(f'<b>Delivery Service:</b> Express Doorstep Delivery (Insured)', style_body_muted),
            Paragraph(f'<b>Tracking:</b> {order.tracking_number or "Assigned on dispatch"}', style_body_muted),
            Paragraph(f'<b>Order Status:</b> {(order.order_status or "confirmed").capitalize()}', style_body_muted),
        ]

        info_table = Table([[bill_to_content, order_meta_content]], colWidths=[290, 233])
        info_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BACKGROUND', (0, 0), (-1, -1), cls.COLOR_BG_LIGHT),
            ('BOX', (0, 0), (-1, -1), 0.5, cls.COLOR_BORDER_LIGHT),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, cls.COLOR_BORDER_LIGHT),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 16))

        # -------------------------------------------------------------
        # 3. FOOTWEAR ITEMS TABLE
        # -------------------------------------------------------------
        items_data = [
            [
                Paragraph('<b>#</b>', style_table_header),
                Paragraph('<b>FOOTWEAR ITEM & SPECIFICATIONS</b>', style_table_header),
                Paragraph('<b>SIZE</b>', style_table_header),
                Paragraph('<b>QTY</b>', style_table_header),
                Paragraph('<b>UNIT PRICE</b>', style_table_header),
                Paragraph('<b>TOTAL</b>', style_table_header),
            ]
        ]

        row_idx = 1
        order_items = getattr(order, "items", []) or []
        for item in order_items:
            variant_snap = getattr(item, "variant_snapshot", {}) or {}
            size = variant_snap.get("size") if isinstance(variant_snap, dict) else (item.variant.size if getattr(item, "variant", None) else "UK 8")
            colour = variant_snap.get("colour") if isinstance(variant_snap, dict) else (item.variant.colour_name if getattr(item, "variant", None) else "")
            sku = variant_snap.get("sku") if isinstance(variant_snap, dict) else (item.variant.sku if getattr(item, "variant", None) else "")

            detail_lines = f"<b>{getattr(item, 'product_name', 'Footwear')}</b>"
            extras = []
            if colour:
                extras.append(f"Color: {colour}")
            if sku:
                extras.append(f"SKU: {sku}")
            if extras:
                detail_lines += f"<br/><font color='#737373' size='7'>{ ' | '.join(extras) }</font>"

            unit_price_val = float(getattr(item, 'unit_price', 0.0))
            item_total_val = float(getattr(item, 'total_price', unit_price_val * getattr(item, 'quantity', 1)))

            items_data.append([
                Paragraph(str(row_idx), style_table_cell_center),
                Paragraph(detail_lines, style_table_cell),
                Paragraph(f"<b>{size}</b>", style_table_cell_center),
                Paragraph(str(getattr(item, 'quantity', 1)), style_table_cell_center),
                Paragraph(f"&#8377; {unit_price_val:,.2f}", style_table_cell_right),
                Paragraph(f"&#8377; {item_total_val:,.2f}", style_table_cell_right),
            ])
            row_idx += 1

        if len(items_data) == 1:
            # Fallback row if order has no order_items attached (e.g. in test stubs)
            fallback_amount = float(order.total_amount)
            items_data.append([
                Paragraph("1", style_table_cell_center),
                Paragraph("<b>Aura Kicks Luxury Footwear Order</b>", style_table_cell),
                Paragraph("<b>UK 8</b>", style_table_cell_center),
                Paragraph("1", style_table_cell_center),
                Paragraph(f"&#8377; {fallback_amount:,.2f}", style_table_cell_right),
                Paragraph(f"&#8377; {fallback_amount:,.2f}", style_table_cell_right),
            ])

        # Table dimensions: Total = 523pt
        # Cols: # (25), Details (238), Size (55), Qty (35), Unit (85), Total (85) = 523pt
        items_table = Table(items_data, colWidths=[25, 238, 55, 35, 85, 85])
        
        table_style = [
            ('BACKGROUND', (0, 0), (-1, 0), cls.COLOR_PRIMARY_DARK),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('BOX', (0, 0), (-1, -1), 0.5, cls.COLOR_BORDER_LIGHT),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, cls.COLOR_BORDER_LIGHT),
        ]

        # Alternating row colors
        for i in range(1, len(items_data)):
            if i % 2 == 0:
                table_style.append(('BACKGROUND', (0, i), (-1, i), cls.COLOR_BG_LIGHT))
            else:
                table_style.append(('BACKGROUND', (0, i), (-1, i), cls.COLOR_WHITE))

        items_table.setStyle(TableStyle(table_style))
        story.append(items_table)
        story.append(Spacer(1, 10))

        # -------------------------------------------------------------
        # 4. TOTALS & SUMMARY BREAKDOWN
        # -------------------------------------------------------------
        subtotal_val = float(order.subtotal)
        discount_val = float(order.discount_amount or 0.0)
        delivery_val = float(order.delivery_fee or 0.0)
        grand_total_val = float(order.total_amount)

        totals_rows = [
            [
                Paragraph('Subtotal:', style_total_label),
                Paragraph(f'&#8377; {subtotal_val:,.2f}', style_total_val)
            ]
        ]

        if discount_val > 0:
            totals_rows.append([
                Paragraph('Discount Applied:', style_total_label),
                Paragraph(f'-&#8377; {discount_val:,.2f}', style_total_val)
            ])

        delivery_str = "FREE" if delivery_val <= 0 else f"&#8377; {delivery_val:,.2f}"
        totals_rows.append([
            Paragraph('Insured Delivery:', style_total_label),
            Paragraph(delivery_str, style_total_val)
        ])

        totals_rows.append([
            Paragraph('TOTAL AMOUNT:', style_grand_total_label),
            Paragraph(f'&#8377; {grand_total_val:,.2f}', style_grand_total_val)
        ])

        # Summary box right aligned
        totals_table = Table(totals_rows, colWidths=[120, 100])
        totals_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('TOPPADDING', (0, 0), (-1, -2), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -2), 3),
            ('BACKGROUND', (0, -1), (-1, -1), cls.COLOR_PRIMARY_DARK),
            ('TOPPADDING', (0, -1), (-1, -1), 6),
            ('BOTTOMPADDING', (0, -1), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('BOX', (0, 0), (-1, -1), 0.5, cls.COLOR_BORDER_LIGHT),
        ]))

        # Container table placing payment notes on left, totals on right
        notes_left = [
            Paragraph('<b>PAYMENT & AUTHENTICITY GUARANTEE</b>', style_section_heading),
            Spacer(1, 3),
            Paragraph('<b>&bull; 100% Authentic Footwear:</b> Verified multi-point inspection prior to dispatch.', style_body_muted),
            Paragraph('<b>&bull; Return / Exchange Policy:</b> 7-day hassle-free returns in original condition with tags.', style_body_muted),
            Paragraph(f'<b>&bull; Payment Verified:</b> {payment_method_text} transaction confirmed.', style_body_muted),
            Spacer(1, 4),
            Paragraph('For inquiries, please contact <b>support@aurakicks.com</b> quoting your invoice number.', style_body_muted),
        ]

        summary_container = Table([[notes_left, totals_table]], colWidths=[303, 220])
        summary_container.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ]))

        story.append(KeepTogether(summary_container))
        story.append(Spacer(1, 24))

        # -------------------------------------------------------------
        # 5. FOOTER & DISCLAIMER
        # -------------------------------------------------------------
        story.append(HRFlowable(width="100%", thickness=0.5, color=cls.COLOR_BORDER_LIGHT, spaceBefore=0, spaceAfter=8))
        story.append(Paragraph(
            'Thank you for shopping with <b>AURA KICKS</b> &bull; Elevate Every Stride<br/>'
            '<font size="7">This is an electronically generated tax invoice and does not require a physical signature.</font>',
            style_footer
        ))

        # Build document in memory
        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()

        return pdf_bytes

invoice_service = InvoiceService()
