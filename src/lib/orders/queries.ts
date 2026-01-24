import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { CART_QUERY_KEYS, ORDER_QUERY_KEYS } from "~/lib/queries/query-keys";
import { formatErrorMessage } from "~/lib/utils/error-formatter";
import { $createOrder, $getOrder, $getOrders } from "./functions";
import type { CreateOrderInput } from "./types";

/**
 * Query Options Factories
 */

export const createOrdersQueryOptions = (params?: { limit?: number; offset?: number }) =>
  queryOptions({
    queryKey: [
      ...ORDER_QUERY_KEYS.list(),
      { limit: params?.limit, offset: params?.offset },
    ],
    queryFn: ({ signal }) =>
      $getOrders({ data: { limit: params?.limit, offset: params?.offset }, signal }),
    staleTime: 1000 * 60 * 5, // 5 minutes - orders don't change frequently
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

export const createOrderQueryOptions = (orderId: string) =>
  queryOptions({
    queryKey: ORDER_QUERY_KEYS.detail(orderId),
    queryFn: ({ signal }) => $getOrder({ data: { orderId }, signal }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

/**
 * Query Hooks
 */

export const useOrders = (params?: { limit?: number; offset?: number }) => {
  return useQuery(createOrdersQueryOptions(params));
};

export const useOrdersSuspense = (params?: { limit?: number; offset?: number }) => {
  return useSuspenseQuery(createOrdersQueryOptions(params));
};

export const useOrder = (orderId: string) => {
  return useQuery(createOrderQueryOptions(orderId));
};

export const useOrderSuspense = (orderId: string) => {
  return useSuspenseQuery(createOrderQueryOptions(orderId));
};

/**
 * Mutation Hooks
 */

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderInput) => $createOrder({ data }),

    onSuccess: (result) => {
      // Invalidate orders list to show new order
      queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.all });

      // Invalidate cart since it's been cleared
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEYS.all });

      toast.success("Order placed successfully!", {
        description: `Order number: ${result.orderNumber}`,
      });
    },

    onError: (error: Error) => {
      toast.error(formatErrorMessage(error));
    },
  });
};
