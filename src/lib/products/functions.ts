import { createServerFn } from "@tanstack/react-start";
import { asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/lib/db";
import { category, product, productImage } from "~/lib/db/schema";

/**
 * Get products with pagination and optional category filter
 */
export const $getProducts = createServerFn({ method: "GET" })
  .inputValidator(
    z
      .object({
        categoryId: z.string().optional(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(12),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const page = data?.page ?? 1;
    const limit = data?.limit ?? 12;
    const offset = (page - 1) * limit;

    const [products, totalCount] = await Promise.all([
      db.query.product.findMany({
        where: data?.categoryId ? eq(product.categoryId, data.categoryId) : undefined,
        with: {
          category: true,
          images: {
            orderBy: [asc(productImage.order)],
            limit: 1, // Get only the first image for listing
          },
        },
        orderBy: [desc(product.createdAt)],
        limit,
        offset,
      }),
      db.query.product.findMany({
        where: data?.categoryId ? eq(product.categoryId, data.categoryId) : undefined,
        columns: {
          id: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalCount.length / limit);

    return {
      products,
      pagination: {
        page,
        limit,
        totalCount: totalCount.length,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
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
