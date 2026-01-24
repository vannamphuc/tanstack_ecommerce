import { createServerFn } from "@tanstack/react-start";
import { asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/lib/db";
import { category, product, productImage } from "~/lib/db/schema";

/**
 * Get all products with optional category filter
 */
export const $getProducts = createServerFn({ method: "GET" })
  .inputValidator(
    z
      .object({
        categoryId: z.string().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const products = await db.query.product.findMany({
      where: data?.categoryId ? eq(product.categoryId, data.categoryId) : undefined,
      with: {
        category: true,
        images: {
          orderBy: [asc(productImage.order)],
          limit: 1, // Get only the first image for listing
        },
      },
      orderBy: [desc(product.createdAt)],
    });

    return products;
  });

/**
 * Get single product by ID with all images
 */
export const $getProduct = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const foundProduct = await db.query.product.findFirst({
      where: eq(product.id, data.id),
      with: {
        category: true,
        images: {
          orderBy: [asc(productImage.order)],
        },
      },
    });

    if (!foundProduct) {
      throw new Error("Product not found");
    }

    return foundProduct;
  });

/**
 * Get all categories
 */
export const $getCategories = createServerFn({ method: "GET" }).handler(async () => {
  const categories = await db.query.category.findMany({
    orderBy: [asc(category.name)],
  });

  return categories;
});

/**
 * Get featured products for home page
 */
export const $getFeaturedProducts = createServerFn({ method: "GET" }).handler(
  async () => {
    const featuredProducts = await db.query.product.findMany({
      where: eq(product.featured, true),
      with: {
        category: true,
        images: {
          orderBy: [asc(productImage.order)],
          limit: 1,
        },
      },
      orderBy: [desc(product.createdAt)],
      limit: 6, // Show only 6 featured products
    });

    return featuredProducts;
  },
);
