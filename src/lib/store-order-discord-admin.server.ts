import {
  STORE_ORDER_STATUSES,
  type StoreOrder,
  type StoreOrderAddress,
  type StoreOrderCustomer,
  type StoreOrderStatus,
} from "@/lib/store-orders";

function text(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

function money(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw new Error("Shipping amount must be zero or greater.");
  return Math.round(n * 100) / 100;
}

async function getSql() {
  const db = await import("@/lib/db");
  return db.getSql();
}

async function getOrderOrThrow(orderId: string): Promise<StoreOrder> {
  const id = text(orderId, 160);
  if (!id) throw new Error("Order id is required.");
  const orders = await import("@/lib/store-orders.server");
  const order = await orders.getStoreOrder(id);
  if (!order) throw new Error("Store order was not found.");
  return order;
}

async function reload(orderId: string): Promise<StoreOrder> {
  return getOrderOrThrow(orderId);
}

export async function discordGetOrder(orderId: string): Promise<StoreOrder> {
  return getOrderOrThrow(orderId);
}

export async function discordSetOrderStatus(
  orderId: string,
  status: StoreOrderStatus,
): Promise<StoreOrder> {
  if (!STORE_ORDER_STATUSES.includes(status)) throw new Error("Invalid order status.");
  await getOrderOrThrow(orderId);
  const sql = await getSql();
  await sql.query(
    `update store_orders
        set status = $2,
            updated_at = now()
      where id = $1`,
    [orderId, status],
  );
  return reload(orderId);
}

export async function discordEditOrderCustomer(
  orderId: string,
  patch: Partial<StoreOrderCustomer>,
): Promise<StoreOrder> {
  const current = await getOrderOrThrow(orderId);
  const customer: StoreOrderCustomer = {
    firstName: text(patch.firstName ?? current.customer.firstName, 100),
    lastName: text(patch.lastName ?? current.customer.lastName, 100),
    email: text(patch.email ?? current.customer.email, 220),
    phone: text(patch.phone ?? current.customer.phone, 80),
    discordName: text(patch.discordName ?? current.customer.discordName, 120) || undefined,
  };
  if (!customer.firstName || !customer.lastName || !customer.email) {
    throw new Error("First name, last name and email are required.");
  }
  const sql = await getSql();
  await sql.query(
    `update store_orders
        set customer = $2::jsonb,
            updated_at = now()
      where id = $1`,
    [orderId, JSON.stringify(customer)],
  );
  return reload(orderId);
}

export async function discordEditOrderAddress(
  orderId: string,
  patch: Partial<StoreOrderAddress>,
): Promise<StoreOrder> {
  const current = await getOrderOrThrow(orderId);
  const address: StoreOrderAddress = {
    address: text(patch.address ?? current.shippingAddress.address, 300),
    city: text(patch.city ?? current.shippingAddress.city, 120),
    state: text(patch.state ?? current.shippingAddress.state, 120),
    postalCode: text(patch.postalCode ?? current.shippingAddress.postalCode, 40),
    country: text(patch.country ?? current.shippingAddress.country, 120),
  };
  if (!address.address || !address.city || !address.country) {
    throw new Error("Street address, city and country are required.");
  }
  const sql = await getSql();
  await sql.query(
    `update store_orders
        set shipping_address = $2::jsonb,
            updated_at = now()
      where id = $1`,
    [orderId, JSON.stringify(address)],
  );
  return reload(orderId);
}

export async function discordEditOrderShipping(
  orderId: string,
  patch: { shippingMethod?: string; shippingAmount?: number | string },
): Promise<StoreOrder> {
  const current = await getOrderOrThrow(orderId);
  const method = text(patch.shippingMethod ?? current.shippingMethod, 100) || "Shipping";
  const amount = patch.shippingAmount === undefined
    ? current.shippingAmount
    : money(patch.shippingAmount);
  const total = Math.round((current.subtotal + amount) * 100) / 100;
  const sql = await getSql();
  await sql.query(
    `update store_orders
        set shipping_method = $2,
            shipping_amount = $3,
            total = $4,
            updated_at = now()
      where id = $1`,
    [orderId, method, amount, total],
  );
  return reload(orderId);
}

export async function discordRemoveOrder(orderId: string): Promise<{ removed: true; orderNumber: string }> {
  const current = await getOrderOrThrow(orderId);
  const sql = await getSql();
  await sql.query("delete from store_orders where id = $1", [orderId]);
  return { removed: true, orderNumber: current.orderNumber };
}
