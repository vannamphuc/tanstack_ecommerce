import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { authMiddleware } from "~/lib/auth/middleware";
import { db } from "~/lib/db";
import { address, cartItem, order, orderItem } from "~/lib/db/schema";

/**
 * Generate order number in format: ORD-YYYYMMDD-XXXX
 */
function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
  return `ORD-${year}${month}${day}-${random}`;
}

/**
 * Create order from cart items
 * This performs a database transaction to:
 * 1. Validate cart is not empty
 * 2. Create order record
 * 3. Copy cart items to order_items
 * 4. Clear cart
 */
export const $createOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      shippingAddress: z.object({
        fullName: z.string().min(2, "Full name must be at least 2 characters"),
        street: z.string().min(5, "Street address must be at least 5 characters"),
        city: z.string().min(2, "City must be at least 2 characters"),
        state: z.string().length(2, "State must be 2 characters").toUpperCase(),
        postalCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid postal code format"),
        country: z.string().default("US"),
        phone: z
          .string()
          .regex(
            /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
            "Invalid phone number format",
          ),
      }),
      saveAddress: z.boolean().default(false),
      addressId: z.string().optional(), // If using existing address
    }),
  )
  .handler(async ({ context, data }) => {
    const userId = context.user.id;

    // Start transaction
    return await db.transaction(async (tx) => {
      // 1. Get cart items with products
      const cartItems = await tx.query.cartItem.findMany({
        where: eq(cartItem.userId, userId),
        with: {
          product: true,
        },
      });

      if (cartItems.length === 0) {
        throw new Error("Cart is empty");
      }

      // 2. Calculate total
      const total = cartItems.reduce((sum, item) => {
        return sum + parseFloat(item.product.price) * item.quantity;
      }, 0);

      // 3. Create or use address
      let shippingAddressId: string;

      if (data.addressId) {
        // Use existing address
        const existingAddress = await tx.query.address.findFirst({
          where: and(eq(address.id, data.addressId), eq(address.userId, userId)),
        });

        if (!existingAddress) {
          throw new Error("Address not found");
        }

        shippingAddressId = existingAddress.id;
      } else if (data.saveAddress) {
        // Create new address and save it
        const [newAddress] = await tx
          .insert(address)
          .values({
            id: nanoid(),
            userId,
            ...data.shippingAddress,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        shippingAddressId = newAddress.id;
      } else {
        // Create temporary address (not saved for future use)
        const [tempAddress] = await tx
          .insert(address)
          .values({
            id: nanoid(),
            userId,
            ...data.shippingAddress,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        shippingAddressId = tempAddress.id;
      }

      // 4. Create order
      const orderNumber = generateOrderNumber();
      const [newOrder] = await tx
        .insert(order)
        .values({
          id: nanoid(),
          userId,
          orderNumber,
          status: "pending",
          total: total.toFixed(2),
          shippingAddressId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // 5. Create order items (snapshot prices at time of order)
      const orderItemsData = cartItems.map((item) => ({
        id: nanoid(),
        orderId: newOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price,
        createdAt: new Date(),
      }));

      await tx.insert(orderItem).values(orderItemsData);

      // 6. Clear cart
      await tx.delete(cartItem).where(eq(cartItem.userId, userId));

      // 7. Return order details
      return {
        id: newOrder.id,
        orderNumber: newOrder.orderNumber,
        status: newOrder.status,
        total: newOrder.total,
        createdAt: newOrder.createdAt,
      };
    });
  });

/**
 * Get all orders for the authenticated user
 */
export const $getOrders = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      limit: z.number().int().positive().default(10),
      offset: z.number().int().nonnegative().default(0),
    }),
  )
  .handler(async ({ context, data }) => {
    const orders = await db.query.order.findMany({
      where: eq(order.userId, context.user.id),
      orderBy: [desc(order.createdAt)],
      limit: data.limit,
      offset: data.offset,
      with: {
        shippingAddress: true,
        items: {
          with: {
            product: {
              with: {
                images: true,
              },
            },
          },
        },
      },
    });

    return orders;
  });

/**
 * Get single order details
 */
export const $getOrder = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ orderId: z.string().min(1) }))
  .handler(async ({ context, data }) => {
    const orderDetails = await db.query.order.findFirst({
      where: and(eq(order.id, data.orderId), eq(order.userId, context.user.id)),
      with: {
        shippingAddress: true,
        items: {
          with: {
            product: {
              with: {
                images: true,
              },
            },
          },
        },
      },
    });

    if (!orderDetails) {
      throw new Error("Order not found");
    }

    return orderDetails;
  });
