import { prisma } from "@/lib/db";
import { whatsappService } from "@/lib/whatsapp";
import { sendOrderEmail, type OrderEmailEvent } from "./email.service";

const orderInclude = { items: true } as const;

/** Indian mobile → E.164 digits without '+', as the WhatsApp Cloud API expects. */
function toWhatsAppNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

async function sendWhatsApp(event: OrderEmailEvent, order: Awaited<ReturnType<typeof loadOrder>>) {
  if (process.env.WHATSAPP_ENABLED !== "true" || !order) return;
  try {
    await prisma.whatsAppEvent.create({
      data: { eventType: event, recipient: order.shippingPhone, orderId: order.id, status: "PENDING" },
    });
  } catch {
    return; // already sent for this order + event
  }
  const phone = toWhatsAppNumber(order.shippingPhone);
  const data = {
    orderNumber: order.orderNumber,
    customerName: order.shippingName,
    total: order.total.toString(),
    items: order.items.map((i) => ({ name: i.productName, quantity: i.quantity, price: i.unitPrice.toString() })),
  };
  // whatsappService swallows provider errors (feature is optional by design).
  if (event === "ORDER_CONFIRMATION") await whatsappService.sendOrderConfirmation(phone, data);
  if (event === "SHIPPED") await whatsappService.sendShippingUpdate(phone, data, order.trackingUrl ?? "");
  if (event === "DELIVERED") await whatsappService.sendDeliveryUpdate(phone, data);
  await prisma.whatsAppEvent.update({
    where: { eventType_orderId: { eventType: event, orderId: order.id } },
    data: { status: "SENT" },
  });
}

function loadOrder(orderId: string) {
  return prisma.order.findUnique({ where: { id: orderId }, include: orderInclude });
}

/**
 * Fire order notifications (email + optional WhatsApp). Never throws: a notification
 * failure must not roll back or fail a payment/status change.
 */
export async function notifyOrderEvent(event: OrderEmailEvent, orderId: string) {
  try {
    const order = await loadOrder(orderId);
    if (!order) return;
    await Promise.allSettled([sendOrderEmail(event, order), sendWhatsApp(event, order)]);
  } catch (error) {
    console.error(`[notify] ${event} for order ${orderId} failed:`, error);
  }
}
