# Notification System Architecture

## 1. Overview
- Dual notification channels: Email (mandatory) + WhatsApp (optional)
- Event-driven architecture
- Idempotent delivery
- Feature-flagged WhatsApp

## 2. Email Service Architecture
- **Provider:** Google SMTP (via Nodemailer)
- **Configuration:** SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM
- Singleton transporter pattern
- Reusable `sendEmail(to, subject, html)` base method

## 3. Email Templates

### Template 1: OTP Verification
- **Subject:** "Your Ghero Verification Code"
- **Body:** branded header, 6-digit OTP code (large, centered), expiry notice (5 minutes), footer
- **Trigger:** POST `/api/auth/send-otp`

### Template 2: Order Confirmation
- **Subject:** "Order Confirmed - #GH-XXXXX"
- **Body:** branded header, greeting with name, order number, product list (image, name, size, color, qty, price), order summary (subtotal, discount, total), shipping address, CTA to view order, footer
- **Trigger:** Payment verified successfully

### Template 3: Order Shipped
- **Subject:** "Your Order #GH-XXXXX Has Been Shipped!"
- **Body:** branded header, greeting, order number, tracking URL (as a button CTA), estimated delivery note, footer
- **Trigger:** Admin changes order status to SHIPPED

### Template 4: Order Delivered
- **Subject:** "Your Order #GH-XXXXX Has Been Delivered"
- **Body:** branded header, greeting, confirmation message, order summary, review CTA (optional), footer
- **Trigger:** Admin changes order status to DELIVERED

## 4. WhatsApp Service Architecture
- Provider abstraction layer
- Interface: `WhatsAppProvider` with `send(phone, template, data)`
- Default provider: MetaCloudAPI
- **Configuration via env vars:** WHATSAPP_ENABLED, WHATSAPP_PROVIDER, WHATSAPP_API_URL, WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID

## 5. WhatsApp Service Methods

```typescript
class WhatsAppService {
  sendOTP(phone: string, otp: string): Promise<void>
  sendOrderConfirmation(phone: string, order: OrderData): Promise<void>
  sendShippingUpdate(phone: string, order: OrderData, trackingUrl: string): Promise<void>
  sendDeliveryUpdate(phone: string, order: OrderData): Promise<void>
  sendCustomMessage(phone: string, message: string): Promise<void>
}
```

## 6. Event Idempotency
- Every notification event is recorded in EmailEvent / WhatsAppEvent tables
- Unique constraint on `[eventType, orderId]` prevents duplicates
- Before sending: check if event already exists

### Idempotency Flow

```mermaid
flowchart TD
    A[Event Triggered] --> B{Check Event Table \n for (eventType, orderId)}
    B -- Exists --> C[Skip - Duplicate]
    B -- Not Exists --> D[Send Notification via Provider]
    D -- Success --> E[Create Event Record \n Status: SENT]
    D -- Failure --> F[Create Event Record \n Status: FAILED]
```

**Flow:**
1. Check EmailEvent for (ORDER_CONFIRMATION, orderId)
2. If exists → skip
3. If not → send email → create EmailEvent record
4. Same for WhatsApp

## 7. Feature Flags
```
WHATSAPP_ENABLED=true|false
```
- If false: WhatsApp methods are no-ops (log and return)
- If true: WhatsApp messages are sent
- Email is always enabled (no flag needed)

## 8. Error Handling
- **Email failures:** log error, create EmailEvent with `status=FAILED`, do not crash the order flow
- **WhatsApp failures:** log error, create WhatsAppEvent with `status=FAILED`, do not crash
- Notifications are fire-and-forget for the main flow (async)
- Failed notifications can be retried from admin panel (future enhancement)

## 9. Notification Trigger Points

| Event | Trigger | Email | WhatsApp |
|---|---|---|---|
| OTP | User requests OTP | ✅ | Optional |
| Order Confirmed | Payment verified | ✅ | Optional |
| Order Shipped | Admin sets SHIPPED | ✅ | Optional |
| Order Delivered | Admin sets DELIVERED | ✅ | Optional |
