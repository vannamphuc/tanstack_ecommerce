import { queryOptions } from "@tanstack/react-query";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { $getProducts, $getProduct, $getCategories, $getFeaturedProducts } from "../products/functions";
import { CATEGORY_QUERY_KEYS, PRODUCT_QUERY_KEYS } from "../queries/query-keys";

/**
 * Query Options Factories
 */

// Products list query options
export const createProductsQueryOptions = (categoryId?: string) =>
  queryOptions({
    queryKey: PRODUCT_QUERY_KEYS.byCategory(categoryId),
    queryFn: ({ signal }) => $getProducts({ data: categoryId ? { categoryId } : undefined, signal }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

// Single product query options
export const createProductQueryOptions = (id: string) =>
  queryOptions({
    queryKey: PRODUCT_QUERY_KEYS.detail(id),
    queryFn: ({ signal }) => $getProduct({ data: { id }, signal }),
    staleTime: 1000 * 60 * 5,
    enabled: id.length > 0,
  });

// Categories query options
export const createCategoriesQueryOptions = () =>
  queryOptions({
    queryKey: CATEGORY_QUERY_KEYS.list(),
    queryFn: ({ signal }) => $getCategories({ signal }),
    staleTime: 1000 * 60 * 10, // 10 minutes - categories change infrequently
    gcTime: 1000 * 60 * 60, // 1 hour
  });

// Featured products query options
export const createFeaturedProductsQueryOptions = () =>
  queryOptions({
    queryKey: PRODUCT_QUERY_KEYS.featured(),
    queryFn: ({ signal }) => $getFeaturedProducts({ signal }),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

/**
 * Custom Hooks - Suspense versions (use with prefetch in loader)
 */

export const useProductsSuspense = (categoryId?: string) => {
  return useSuspenseQuery(createProductsQueryOptions(categoryId));
};

export const useProductSuspense = (id: string) => {
  return useSuspenseQuery(createProductQueryOptions(id));
};

export const useCategoriesSuspense = () => {
  return useSuspenseQuery(createCategoriesQueryOptions());
};

export const useFeaturedProductsSuspense = () => {
  return useSuspenseQuery(createFeaturedProductsQueryOptions());
};

/**
 * Custom Hooks - Non-suspense versions (for conditional/lazy fetching)
 */

export const useProducts = (categoryId?: string) => {
  return useQuery(createProductsQueryOptions(categoryId));
};

export const useProduct = (id: string) => {
  return useQuery(createProductQueryOptions(id));
};

export const useCategories = () => {
  return useQuery(createCategoriesQueryOptions());
};

export const useFeaturedProducts = () => {
  return useQuery(createFeaturedProductsQueryOptions());
};
