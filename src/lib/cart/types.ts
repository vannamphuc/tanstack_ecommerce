import type { $getCartItems, $getCartSummary } from "./functions";

/**
 * Type inference from server functions
 */
export type CartItems = Awaited<ReturnType<typeof $getCartItems>>;
export type CartItem = CartItems[number];
export type CartSummary = Awaited<ReturnType<typeof $getCartSummary>>;
