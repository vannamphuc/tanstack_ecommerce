import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { authMiddleware } from "~/lib/auth/middleware";
import { db } from "~/lib/db";
import { cartItem, productImage } from "~/lib/db/schema";

/**
 * Get all cart items for the authenticated user with product details
 */
export const $getCartItems = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const items = await db.query.cartItem.findMany({
      where: eq(cartItem.userId, context.user.id),
      with: {
        product: {
          with: {
            category: true,
            images: {
              orderBy: [desc(productImage.order)],
              limit: 1,
            },
          },
        },
      },
      orderBy: [desc(cartItem.createdAt)],
    });

    return items;
  });

/**
 * Get cart summary (total items and price)
 */
export const $getCartSummary = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const items = await db.query.cartItem.findMany({
      where: eq(cartItem.userId, context.user.id),
      with: {
        product: true,
      },
    });

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce(
      (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
      0,
    );

    return {
      itemCount: totalItems,
      totalPrice: totalPrice.toFixed(2),
    };
  });

/**
 * Add item to cart or update quantity if already exists (upsert)
 */
export const $addToCart = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().positive().default(1),
    }),
  )
  .handler(async ({ context, data }) => {
    // Check if item already exists in cart
    const existingItem = await db.query.cartItem.findFirst({
      where: and(
        eq(cartItem.userId, context.user.id),
        eq(cartItem.productId, data.productId),
      ),
    });

    if (existingItem) {
      // Update quantity
      const [updatedItem] = await db
        .update(cartItem)
        .set({
          quantity: existingItem.quantity + data.quantity,
          updatedAt: new Date(),
        })
        .where(eq(cartItem.id, existingItem.id))
        .returning();

      return updatedItem;
    } else {
      // Insert new item
      const [newItem] = await db
        .insert(cartItem)
        .values({
          id: nanoid(),
          userId: context.user.id,
          productId: data.productId,
          quantity: data.quantity,
        })
        .returning();

      return newItem;
    }
  });

/**
 * Update cart item quantity
 */
export const $updateCartItem = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      cartItemId: z.string().min(1),
      quantity: z.number().int().positive(),
    }),
  )
  .handler(async ({ context, data }) => {
    // Verify the cart item belongs to the user
    const item = await db.query.cartItem.findFirst({
      where: and(eq(cartItem.id, data.cartItemId), eq(cartItem.userId, context.user.id)),
    });

    if (!item) {
      throw new Error("Cart item not found");
    }

    const [updatedItem] = await db
      .update(cartItem)
      .set({
        quantity: data.quantity,
        updatedAt: new Date(),
      })
      .where(eq(cartItem.id, data.cartItemId))
      .returning();

    return updatedItem;
  });

/**
 * Remove item from cart
 */
export const $removeFromCart = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      cartItemId: z.string().min(1),
    }),
  )
  .handler(async ({ context, data }) => {
    // Verify the cart item belongs to the user
    const item = await db.query.cartItem.findFirst({
      where: and(eq(cartItem.id, data.cartItemId), eq(cartItem.userId, context.user.id)),
    });

    if (!item) {
      throw new Error("Cart item not found");
    }

    await db.delete(cartItem).where(eq(cartItem.id, data.cartItemId));

    return { success: true };
  });

/**
 * Clear all items from cart
 */
export const $clearCart = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await db.delete(cartItem).where(eq(cartItem.userId, context.user.id));

    return { success: true };
  });
