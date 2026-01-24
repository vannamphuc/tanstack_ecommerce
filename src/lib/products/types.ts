import type { $getProducts, $getProduct, $getCategories, $getFeaturedProducts } from "./functions";

/**
 * Type inference from server functions
 */
export type Product = Awaited<ReturnType<typeof $getProduct>>;
export type Products = Awaited<ReturnType<typeof $getProducts>>;
export type ProductListItem = Products[number];
export type Category = Awaited<ReturnType<typeof $getCategories>>[number];
export type Categories = Awaited<ReturnType<typeof $getCategories>>;
export type FeaturedProducts = Awaited<ReturnType<typeof $getFeaturedProducts>>;
