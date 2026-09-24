/**
 * WhatsApp Service - Provider Abstraction Layer
 *
 * This module creates a provider-agnostic WhatsApp messaging interface.
 * The actual provider (Meta Cloud API, etc.) is configured via environment variables.
 * If WHATSAPP_ENABLED is false, all methods are no-ops.
 */

interface OrderData {
  orderNumber: string;
  customerName: string;
  total: string;
  items: Array<{
    name: string;
    quantity: number;
    price: string;
  }>;
}

interface WhatsAppProvider {
  sendMessage(phone: string, template: string, data: Record<string, string>): Promise<void>;
}

/**
 * Meta Cloud API provider implementation.
 */
class MetaCloudAPIProvider implements WhatsAppProvider {
  private apiUrl: string;
  private accessToken: string;
  private phoneNumberId: string;

  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL || "https://graph.facebook.com/v18.0";
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || "";
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
  }

  async sendMessage(
    phone: string,
    template: string,
    data: Record<string, string>
  ): Promise<void> {
    const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
          name: template,
          language: { code: "en" },
          components: [
            {
              type: "body",
              parameters: Object.entries(data).map(([, value]) => ({
                type: "text",
                text: value,
              })),
            },
          ],
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WhatsApp API error: ${error}`);
    }
  }
}

/**
 * WhatsApp Service with provider abstraction.
 * All methods are no-ops when WHATSAPP_ENABLED is false.
 */
class WhatsAppService {
  private provider: WhatsAppProvider | null = null;
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.WHATSAPP_ENABLED === "true";

    if (this.enabled) {
      const providerType = process.env.WHATSAPP_PROVIDER || "meta";
      switch (providerType) {
        case "meta":
          this.provider = new MetaCloudAPIProvider();
          break;
        default:
          console.warn(`Unknown WhatsApp provider: ${providerType}. WhatsApp disabled.`);
          this.enabled = false;
      }
    }
  }

  async sendOTP(phone: string, otp: string): Promise<void> {
    if (!this.enabled || !this.provider) return;
    try {
      await this.provider.sendMessage(phone, "otp_verification", { otp });
    } catch (error) {
      console.error("WhatsApp OTP send failed:", error);
    }
  }

  async sendOrderConfirmation(phone: string, order: OrderData): Promise<void> {
    if (!this.enabled || !this.provider) return;
    try {
      await this.provider.sendMessage(phone, "order_confirmation", {
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        total: order.total,
      });
    } catch (error) {
      console.error("WhatsApp order confirmation send failed:", error);
    }
  }

  async sendShippingUpdate(
    phone: string,
    order: OrderData,
    trackingUrl: string
  ): Promise<void> {
    if (!this.enabled || !this.provider) return;
    try {
      await this.provider.sendMessage(phone, "order_shipped", {
        orderNumber: order.orderNumber,
        trackingUrl,
      });
    } catch (error) {
      console.error("WhatsApp shipping update send failed:", error);
    }
  }

  async sendDeliveryUpdate(phone: string, order: OrderData): Promise<void> {
    if (!this.enabled || !this.provider) return;
    try {
      await this.provider.sendMessage(phone, "order_delivered", {
        orderNumber: order.orderNumber,
        customerName: order.customerName,
      });
    } catch (error) {
      console.error("WhatsApp delivery update send failed:", error);
    }
  }

  async sendCustomMessage(phone: string, message: string): Promise<void> {
    if (!this.enabled || !this.provider) return;
    try {
      await this.provider.sendMessage(phone, "custom_message", { message });
    } catch (error) {
      console.error("WhatsApp custom message send failed:", error);
    }
  }
}

// Singleton instance
export const whatsappService = new WhatsAppService();
