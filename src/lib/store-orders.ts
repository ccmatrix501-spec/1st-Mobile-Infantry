export type StoreOrderStatus =
  | "new"
  | "paid"
  | "approved"
  | "packing"
  | "shipped"
  | "completed"
  | "cancelled";

export const STORE_ORDER_STATUSES: StoreOrderStatus[] = [
  "new",
  "paid",
  "approved",
  "packing",
  "shipped",
  "completed",
  "cancelled",
];

export function storeOrderStatusLabel(status: StoreOrderStatus): string {
  switch (status) {
    case "new":
      return "New";
    case "paid":
      return "Paid";
    case "approved":
      return "Approved";
    case "packing":
      return "Packing";
    case "shipped":
      return "Shipped";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
  }
}

export type StoreOrderCustomer = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  discordName?: string;
};

export type StoreOrderAddress = {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type StoreOrderItem = {
  productId: string;
  productName: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type StoreCompletedOrderInput = {
  currency: string;
  subtotal: number;
  shippingAmount: number;
  total: number;
  shippingMethod: string;
  customer: StoreOrderCustomer;
  shippingAddress: StoreOrderAddress;
  items: StoreOrderItem[];
  paymentProvider: string;
  paymentReference: string;
};

export type StoreOrder = StoreCompletedOrderInput & {
  id: string;
  orderNumber: string;
  status: StoreOrderStatus;
  placedAt: string;
  updatedAt: string;
  discordNotified: boolean;
  discordNotifiedAt: string | null;
  discordError: string | null;
};

export type StoreOrderBotHealth = {
  reachable: boolean;
  botReady: boolean | null;
  secretConfigured: boolean | null;
  channelId: string | null;
  error: string | null;
};

export type StoreOrderSystemStatus = {
  discordConfigured: boolean;
  siteUrl: string;
  orderCount: number;
  notificationMode: "bot-forum" | "webhook" | "none";
  websiteBotUrl: string;
  websiteSecretConfigured: boolean;
  botHealth: StoreOrderBotHealth;
};

export function storeOrderCustomerName(order: Pick<StoreOrder, "customer">): string {
  return `${order.customer.firstName} ${order.customer.lastName}`.trim();
}

export function storeOrderItemCount(order: Pick<StoreOrder, "items">): number {
  return order.items.reduce((sum, item) => sum + item.quantity, 0);
}
