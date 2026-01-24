/**
 * Query Key Factories
 * Following TanStack Query best practices for key structure
 */

// Auth Query Keys
export const AUTH_QUERY_KEYS = {
  all: ["auth"] as const,
  user: () => [...AUTH_QUERY_KEYS.all, "user"] as const,
  session: () => [...AUTH_QUERY_KEYS.all, "session"] as const,
} as const;

// Product Query Keys
export const PRODUCT_QUERY_KEYS = {
  all: ["products"] as const,
  lists: () => [...PRODUCT_QUERY_KEYS.all, "list"] as const,
  list: () => [...PRODUCT_QUERY_KEYS.lists()] as const,
  byCategory: (categoryId?: string, page: number = 1, limit: number = 12) =>
    categoryId
      ? ([...PRODUCT_QUERY_KEYS.lists(), { categoryId, page, limit }] as const)
      : ([...PRODUCT_QUERY_KEYS.lists(), { page, limit }] as const),
  details: () => [...PRODUCT_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...PRODUCT_QUERY_KEYS.details(), id] as const,
  featured: () => [...PRODUCT_QUERY_KEYS.all, "featured"] as const,
} as const;

// Category Query Keys
export const CATEGORY_QUERY_KEYS = {
  all: ["categories"] as const,
  list: () => [...CATEGORY_QUERY_KEYS.all, "list"] as const,
} as const;

// Cart Query Keys
export const CART_QUERY_KEYS = {
  all: ["cart"] as const,
  items: () => [...CART_QUERY_KEYS.all, "items"] as const,
  summary: () => [...CART_QUERY_KEYS.all, "summary"] as const,
} as const;

// Order Query Keys
export const ORDER_QUERY_KEYS = {
  all: ["orders"] as const,
  lists: () => [...ORDER_QUERY_KEYS.all, "list"] as const,
  list: () => [...ORDER_QUERY_KEYS.lists()] as const,
  details: () => [...ORDER_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...ORDER_QUERY_KEYS.details(), id] as const,
} as const;

// Address Query Keys
export const ADDRESS_QUERY_KEYS = {
  all: ["addresses"] as const,
  list: () => [...ADDRESS_QUERY_KEYS.all, "list"] as const,
} as const;
