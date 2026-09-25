import type { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { badRequest, notFound } from "@/lib/api";
import { toNumber } from "@/lib/money";
import type { UpdateOrderStatusInput } from "@/lib/validations/order";
import type { OrderDetail, OrderSummary } from "@/types/order";
import { restoreStockForOrder, lowStockCount } from "./inventory.service";
import { notifyOrderEvent } from "./notification.service";
import { PAID_STATUSES } from "./user.service";

const detailInclude = {
  items: { orderBy: { createdAt: "asc" as const } },
  payment: true,
} satisfies Prisma.OrderInclude;

type OrderWithDetail = Prisma.OrderGetPayload<{ include: typeof detailInclude }>;

function toDetail(o: OrderWithDetail): OrderDetail {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    subtotal: toNumber(o.subtotal),
    discount: toNumber(o.discount),
    couponCode: o.couponCode,
    couponDiscount: toNumber(o.couponDiscount),
    shippingFee: toNumber(o.shippingFee),
    total: toNumber(o.total),
    trackingUrl: o.trackingUrl,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    items: o.items.map((i) => ({
      id: i.id,
      productName: i.productName,
      productSlug: i.productSlug,
      sku: i.sku,
      size: i.size,
      color: i.color,
      quantity: i.quantity,
      unitPrice: toNumber(i.unitPrice),
      unitMrp: toNumber(i.unitMrp),
      imageUrl: i.imageUrl,
    })),
    shipping: {
      name: o.shippingName,
      phone: o.shippingPhone,
      email: o.shippingEmail,
      address1: o.shippingAddress1,
      address2: o.shippingAddress2,
      area: o.shippingArea,
      city: o.shippingCity,
      state: o.shippingState,
      pincode: o.shippingPincode,
      country: o.shippingCountry,
    },
    payment: o.payment
      ? {
          razorpayPaymentId: o.payment.razorpayPaymentId,
          amount: toNumber(o.payment.amount),
          currency: o.payment.currency,
          status: o.payment.status,
        }
      : null,
  };
}

// ---------------------------------------------------------------------------
// Customer
// ---------------------------------------------------------------------------

export async function listUserOrders(userId: string): Promise<OrderSummary[]> {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: { select: { productName: true, quantity: true, imageUrl: true } },
      payment: { select: { status: true } },
    },
  });
  return orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    paymentStatus: o.payment?.status ?? "PENDING",
    total: toNumber(o.total),
    itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
    itemsSummary: o.items.map((i) => i.productName).join(", "),
    imageUrl: o.items[0]?.imageUrl ?? null,
    createdAt: o.createdAt.toISOString(),
    trackingUrl: o.trackingUrl,
  }));
}

/** Customers can only read their own orders; anything else is a 404 (no existence leak). */
export async function getUserOrder(userId: string, orderId: string): Promise<OrderDetail> {
  const order = await prisma.order.findFirst({ where: { id: orderId, userId }, include: detailInclude });
  if (!order) throw notFound("Order not found");
  return toDetail(order);
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

/**
 * Allowed manual transitions. PAID is only ever set by payment capture, never by hand.
 * Statuses can't move backwards; CANCELLED and DELIVERED are terminal.
 */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["CANCELLED"],
  PAID: ["PROCESSING", "SHIPPED", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export async function adminListOrders(params: {
  status?: OrderStatus;
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: "newest" | "oldest" | "total_desc" | "total_asc";
}) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const q = params.q?.trim();
  const where: Prisma.OrderWhereInput = {
    ...(params.status ? { status: params.status } : {}),
    ...(q
      ? {
          OR: [
            { orderNumber: { contains: q, mode: "insensitive" } },
            { shippingName: { contains: q, mode: "insensitive" } },
            { shippingEmail: { contains: q, mode: "insensitive" } },
            { shippingPhone: { contains: q } },
          ],
        }
      : {}),
  };
  const orderBy: Prisma.OrderOrderByWithRelationInput =
    params.sort === "oldest"
      ? { createdAt: "asc" }
      : params.sort === "total_desc"
        ? { total: "desc" }
        : params.sort === "total_asc"
          ? { total: "asc" }
          : { createdAt: "desc" };

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { items: { select: { quantity: true } }, payment: { select: { status: true } } },
    }),
  ]);
  return {
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.shippingName,
      customerEmail: o.shippingEmail,
      customerPhone: o.shippingPhone,
      total: toNumber(o.total),
      itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
      status: o.status,
      paymentStatus: o.payment?.status ?? "PENDING",
      needsReview: Boolean(o.notes),
      createdAt: o.createdAt.toISOString(),
    })),
  };
}

export async function adminGetOrder(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: { ...detailInclude, user: { select: { id: true, name: true, email: true, phone: true } } },
  });
  if (!order) throw notFound("Order not found");
  return {
    ...toDetail(order),
    notes: order.notes,
    stockCommitted: order.stockCommitted,
    customer: order.user,
    allowedTransitions: TRANSITIONS[order.status],
  };
}

export async function adminUpdateOrderStatus(id: string, input: UpdateOrderStatusInput) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw notFound("Order not found");

  if (input.status !== order.status) {
    if (!TRANSITIONS[order.status].includes(input.status)) {
      throw badRequest(`Can't change an order from ${order.status} to ${input.status}`, "INVALID_TRANSITION");
    }
  }

  await prisma.$transaction(async (tx) => {
    // Conditional on the status we read, so two admins can't apply conflicting changes.
    const updated = await tx.order.updateMany({
      where: { id, status: order.status },
      data: {
        status: input.status,
        ...(input.trackingUrl !== undefined ? { trackingUrl: input.trackingUrl } : {}),
        ...(input.notes !== undefined ? { notes: input.notes || null } : {}),
        ...(input.status === "CANCELLED" && order.stockCommitted ? { stockCommitted: false } : {}),
      },
    });
    if (updated.count === 0) throw badRequest("This order was just updated by someone else. Please refresh.");
    if (input.status === "CANCELLED" && order.stockCommitted) {
      await restoreStockForOrder(tx, id);
    }
  });

  if (input.status !== order.status) {
    if (input.status === "SHIPPED") await notifyOrderEvent("SHIPPED", id);
    if (input.status === "DELIVERED") await notifyOrderEvent("DELIVERED", id);
  }
  return adminGetOrder(id);
}

export async function adminDashboard() {
  const [statusCounts, revenue, totalCustomers, totalProducts, publishedProducts, lowStock, recentOrders, recentCustomers] =
    await Promise.all([
      prisma.order.groupBy({ by: ["status"], _count: true }),
      prisma.order.aggregate({ where: { status: { in: [...PAID_STATUSES] } }, _sum: { total: true } }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.product.count(),
      prisma.product.count({ where: { isPublished: true } }),
      lowStockCount(),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, orderNumber: true, shippingName: true, shippingEmail: true, total: true, status: true, createdAt: true },
      }),
      prisma.user.findMany({
        where: { role: "CUSTOMER" },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, name: true, email: true, phone: true, createdAt: true },
      }),
    ]);

  const count = (s: OrderStatus) => statusCounts.find((c) => c.status === s)?._count ?? 0;
  return {
    metrics: {
      totalOrders: statusCounts.reduce((s, c) => s + c._count, 0),
      totalRevenue: toNumber(revenue._sum.total),
      pendingOrders: count("PENDING_PAYMENT"),
      paidOrders: count("PAID"),
      processingOrders: count("PROCESSING"),
      shippedOrders: count("SHIPPED"),
      deliveredOrders: count("DELIVERED"),
      cancelledOrders: count("CANCELLED"),
      totalCustomers,
      totalProducts,
      publishedProducts,
      lowStockProducts: lowStock,
    },
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.shippingName,
      customerEmail: o.shippingEmail,
      total: toNumber(o.total),
      status: o.status,
      createdAt: o.createdAt.toISOString(),
    })),
    recentCustomers: recentCustomers.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })),
  };
}

export async function adminListCustomers(params: { q?: string; page?: number; pageSize?: number }) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const q = params.q?.trim();
  const where: Prisma.UserWhereInput = {
    role: "CUSTOMER",
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
          ],
        }
      : {}),
  };
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
    }),
  ]);
  const stats = await prisma.order.groupBy({
    by: ["userId"],
    where: { userId: { in: users.map((u) => u.id) }, status: { in: [...PAID_STATUSES] } },
    _count: true,
    _sum: { total: true },
    _max: { createdAt: true },
  });
  const byUser = new Map(stats.map((s) => [s.userId, s]));
  return {
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    customers: users.map((u) => {
      const s = byUser.get(u.id);
      return {
        ...u,
        createdAt: u.createdAt.toISOString(),
        totalOrders: s?._count ?? 0,
        totalSpent: toNumber(s?._sum.total),
        lastOrderDate: s?._max.createdAt?.toISOString() ?? null,
      };
    }),
  };
}

export async function adminGetCustomer(id: string) {
  const user = await prisma.user.findFirst({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      addresses: { orderBy: { isDefault: "desc" } },
    },
  });
  if (!user) throw notFound("Customer not found");
  return { ...user, orders: await listUserOrders(id) };
}
