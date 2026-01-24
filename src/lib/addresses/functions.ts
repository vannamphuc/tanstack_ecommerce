import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { authMiddleware } from "~/lib/auth/middleware";
import { db } from "~/lib/db";
import { address } from "~/lib/db/schema";

/**
 * Address validation schema
 */
const addressSchema = z.object({
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
  isDefault: z.boolean().default(false),
});

/**
 * Get all addresses for the authenticated user
 */
export const $getAddresses = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const addresses = await db.query.address.findMany({
      where: eq(address.userId, context.user.id),
      orderBy: (addresses, { desc }) => [desc(addresses.isDefault)],
    });

    return addresses;
  });

/**
 * Create a new address
 */
export const $createAddress = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(addressSchema)
  .handler(async ({ context, data }) => {
    const userId = context.user.id;

    return await db.transaction(async (tx) => {
      // If this is set as default, unset other defaults
      if (data.isDefault) {
        await tx
          .update(address)
          .set({ isDefault: false })
          .where(eq(address.userId, userId));
      }

      // Create new address
      const [newAddress] = await tx
        .insert(address)
        .values({
          id: nanoid(),
          userId,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return newAddress;
    });
  });

/**
 * Update an existing address
 */
export const $updateAddress = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      addressId: z.string().min(1),
      ...addressSchema.shape,
    }),
  )
  .handler(async ({ context, data }) => {
    const userId = context.user.id;
    const { addressId, ...addressData } = data;

    // Verify address belongs to user
    const existingAddress = await db.query.address.findFirst({
      where: and(eq(address.id, addressId), eq(address.userId, userId)),
    });

    if (!existingAddress) {
      throw new Error("Address not found");
    }

    return await db.transaction(async (tx) => {
      // If this is set as default, unset other defaults
      if (data.isDefault) {
        await tx
          .update(address)
          .set({ isDefault: false })
          .where(and(eq(address.userId, userId), eq(address.id, addressId)));
      }

      // Update address
      const [updatedAddress] = await tx
        .update(address)
        .set({
          ...addressData,
          updatedAt: new Date(),
        })
        .where(eq(address.id, addressId))
        .returning();

      return updatedAddress;
    });
  });

/**
 * Delete an address
 */
export const $deleteAddress = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ addressId: z.string().min(1) }))
  .handler(async ({ context, data }) => {
    const userId = context.user.id;

    // Verify address belongs to user
    const existingAddress = await db.query.address.findFirst({
      where: and(eq(address.id, data.addressId), eq(address.userId, userId)),
    });

    if (!existingAddress) {
      throw new Error("Address not found");
    }

    // Delete address
    await db.delete(address).where(eq(address.id, data.addressId));

    return { success: true };
  });
