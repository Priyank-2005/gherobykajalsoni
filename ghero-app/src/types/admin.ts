/**
 * Admin dashboard types.
 */
export interface DashboardMetrics {
  totalOrders: number;
  totalRevenue: number;
  paidOrders: number;
  pendingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalCustomers: number;
  totalProducts: number;
  publishedProducts: number;
  lowStockProducts: number;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
  createdAt: string;
}

export interface RecentCustomer {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
}

export interface AdminDashboardData {
  metrics: DashboardMetrics;
  recentOrders: RecentOrder[];
  recentCustomers: RecentCustomer[];
}

/**
 * Admin product list item.
 */
export interface AdminProductListItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  basePrice: number;
  baseMrp: number;
  totalStock: number;
  variantCount: number;
  isPublished: boolean;
  isBestseller: boolean;
  isNewArrival: boolean;
  imageUrl: string | null;
  createdAt: string;
}

/**
 * Admin customer list item.
 */
export interface AdminCustomerListItem {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
  createdAt: string;
}
