import type { $createOrder, $getOrder, $getOrders } from "./functions";

/**
 * Type Exports for Orders
 */
export type Orders = Awaited<ReturnType<typeof $getOrders>>;
export type Order = Orders[number];

export type OrderDetails = Awaited<ReturnType<typeof $getOrder>>;
export type OrderItem = OrderDetails["items"][number];

export type CreateOrderResult = Awaited<ReturnType<typeof $createOrder>>;

/**
 * Order status types
 */
export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

/**
 * Create order input type
 */
export interface CreateOrderInput {
  shippingAddress: {
    fullName: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  saveAddress?: boolean;
  addressId?: string;
}
