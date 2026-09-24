import fpdf
from fpdf import FPDF

class PDF(FPDF):
    def header(self):
        self.set_font('helvetica', 'B', 16)
        self.cell(0, 10, 'Website Development Proposal', border=False, align='C')
        self.ln(15)

    def footer(self):
        self.set_y(-15)
        self.set_font('helvetica', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

pdf = PDF()
pdf.add_page()

# Client Details
pdf.set_font("helvetica", 'B', 11)
pdf.cell(0, 7, "Date: September 20, 2026", ln=True)
pdf.cell(0, 7, "Client: Ghero by Kajal Soni", ln=True)
pdf.cell(0, 7, "Project: E-commerce Website Development", ln=True)
pdf.ln(5)

# Section 1
pdf.set_font("helvetica", 'B', 12)
pdf.set_text_color(0, 51, 102)
pdf.cell(0, 10, "1. Developer Charges & Features", ln=True)
pdf.set_text_color(0, 0, 0)

pdf.set_font("helvetica", size=10)
pdf.multi_cell(0, 6, "The total developer cost for the website is INR 30,000. Below is the feature-wise breakdown of the development charges along with the included details:")
pdf.ln(4)

features = [
    ("Homepage", "Custom design with 3 to 4 sections. Includes the ability to dynamically update homepage content, banners, and featured products from the admin backend.", "10,000"),
    ("Product Detail Page", "Dedicated product pages featuring high-quality images, comprehensive descriptions, pricing, specifications, and related items.", "2,500"),
    ("Cart & Checkout", "Seamless add-to-cart functionality, cart review, and a streamlined, user-friendly checkout process.", "2,500"),
    ("User Management", "Secure user registration, login, and profile pages. Includes OTP verification for enhanced security during authentication.", "2,000"),
    ("Payment Integration", "Integration with a secure online payment gateway to process cards, UPI, and digital transactions smoothly.", "2,000"),
    ("Automated Emails", "System-generated emails for critical updates, including OTPs, order confirmations, invoice receipts, and order statuses.", "1,500"),
    ("WhatsApp API", "Automated WhatsApp notifications to customers for order confirmations, dispatch updates, and delivery tracking.", "1,500"),
    ("Admin Panel", "Comprehensive backend dashboard to manage products, categories, daily orders, customer data, and homepage details.", "8,000"),
]

# Table header
pdf.set_fill_color(240, 240, 240)
pdf.set_font("helvetica", 'B', 10)
pdf.cell(35, 10, "Feature", 1, 0, 'C', fill=True)
pdf.cell(130, 10, "Detailed Description", 1, 0, 'C', fill=True)
pdf.cell(25, 10, "Cost (INR)", 1, 1, 'C', fill=True)

# Table body
pdf.set_font("helvetica", size=9)
for item in features:
    # Calculate height required for description
    desc = item[1]
    # Rough estimate: 130 width allows about 70-80 chars per line depending on font
    lines = pdf.get_string_width(desc) / 125
    import math
    h = 6 * math.ceil(lines + 0.2) 
    if h < 12: h = 12 # minimum height

    x = pdf.get_x()
    y = pdf.get_y()
    
    # Check if page break is needed
    if y + h > 270:
        pdf.add_page()
        y = pdf.get_y()

    # Draw cells
    pdf.rect(x, y, 35, h)
    pdf.rect(x + 35, y, 130, h)
    pdf.rect(x + 165, y, 25, h)
    
    # Feature Name
    pdf.set_xy(x, y + (h-6)/2)
    pdf.set_font("helvetica", 'B', 9)
    pdf.cell(35, 6, item[0], 0, 0, 'C')
    
    # Description
    pdf.set_xy(x + 35, y + 2)
    pdf.set_font("helvetica", size=9)
    pdf.multi_cell(130, 5, desc, 0, 'L')
    
    # Cost
    pdf.set_xy(x + 165, y + (h-6)/2)
    pdf.set_font("helvetica", 'B', 9)
    pdf.cell(25, 6, item[2], 0, 1, 'C')

    pdf.set_y(y + h)

# Total Row
pdf.set_font("helvetica", 'B', 10)
pdf.cell(165, 10, "Total Developer Cost", 1, 0, 'R')
pdf.cell(25, 10, "30,000", 1, 1, 'C')
pdf.ln(8)

# Section 2
pdf.set_font("helvetica", 'B', 12)
pdf.set_text_color(0, 51, 102)
pdf.cell(0, 10, "2. Domain & Server Hosting", ln=True)
pdf.set_text_color(0, 0, 0)

# Domain
pdf.set_font("helvetica", 'B', 10)
pdf.cell(0, 7, "Domain Name:", ln=True)
pdf.set_font("helvetica", size=10)
pdf.multi_cell(0, 6, "- Domain URL: gherobykajalsoni.com\n- First Year Pricing: INR 1\n- Renewal Pricing: INR 1,600 per year (applicable from the second year onwards)")
pdf.ln(3)

# Hosting
pdf.set_font("helvetica", 'B', 10)
pdf.cell(0, 7, "Server Hosting Charges:", ln=True)
pdf.set_font("helvetica", size=10)
pdf.multi_cell(0, 6, "- Free Tier: The backend server hosting remains completely Free for up to 3,000 active users and approximately 100 to 150 orders per month.\n- Paid Tier: If the active user count exceeds 3,000 per month, the server hosting will need to be upgraded to a dedicated paid plan.\n- Estimated Paid Hosting Cost: Approx. INR 2,000 per month (applicable only after crossing the free tier threshold limits).")

pdf.output(r"D:\ghero\Website_Proposal.pdf")
