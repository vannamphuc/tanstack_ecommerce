import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { CART_QUERY_KEYS } from "~/lib/queries/query-keys";
import {
  $addToCart,
  $clearCart,
  $getCartItems,
  $getCartSummary,
  $removeFromCart,
  $updateCartItem,
} from "./functions";
import type { CartItem } from "./types";

/**
 * Query Options Factories
 */

export const createCartItemsQueryOptions = () =>
  queryOptions({
    queryKey: CART_QUERY_KEYS.items(),
    queryFn: ({ signal }) => $getCartItems({ signal }),
    staleTime: 1000 * 30, // 30 seconds - cart data should be fresh
    gcTime: 1000 * 60 * 5, // 5 minutes
  });

export const createCartSummaryQueryOptions = () =>
  queryOptions({
    queryKey: CART_QUERY_KEYS.summary(),
    queryFn: ({ signal }) => $getCartSummary({ signal }),
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
  });

/**
 * Query Hooks
 */

export const useCartItems = () => {
  return useQuery(createCartItemsQueryOptions());
};

export const useCartItemsSuspense = () => {
  return useSuspenseQuery(createCartItemsQueryOptions());
};

export const useCartSummary = () => {
  return useQuery(createCartSummaryQueryOptions());
};

/**
 * Mutation Hooks with Optimistic Updates
 */

export const useAddToCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { productId: string; quantity: number }) => $addToCart({ data }),

    onSuccess: () => {
      // Invalidate both cart items and summary
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEYS.items() });
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEYS.summary() });
      toast.success("Added to cart");
    },

    onError: (error: Error) => {
      toast.error(error?.message || "Failed to add to cart");
    },
  });
};

export const useUpdateCartQuantity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { cartItemId: string; quantity: number }) =>
      $updateCartItem({ data }),

    // Optimistic update
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEYS.items() });
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEYS.summary() });

      // Snapshot previous values
      const previousItems = queryClient.getQueryData(CART_QUERY_KEYS.items());
      const previousSummary = queryClient.getQueryData(CART_QUERY_KEYS.summary());

      // Optimistically update cart items
      queryClient.setQueryData(CART_QUERY_KEYS.items(), (old: CartItem[] | undefined) => {
        if (!old) return old;
        return old.map((item) =>
          item.id === newData.cartItemId ? { ...item, quantity: newData.quantity } : item,
        );
      });

      // Optimistically update summary
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueryData(CART_QUERY_KEYS.summary(), (old: any) => {
        if (!old || !previousItems) return old;

        const items = previousItems as CartItem[];
        const updatedItem = items.find((item) => item.id === newData.cartItemId);
        if (!updatedItem) return old;

        const quantityDiff = newData.quantity - updatedItem.quantity;
        const priceDiff = parseFloat(updatedItem.product.price) * quantityDiff;

        return {
          itemCount: old.itemCount + quantityDiff,
          totalPrice: (parseFloat(old.totalPrice) + priceDiff).toFixed(2),
        };
      });

      return { previousItems, previousSummary };
    },

    onError: (error: Error, _newData, context) => {
      // Rollback on error
      if (context?.previousItems) {
        queryClient.setQueryData(CART_QUERY_KEYS.items(), context.previousItems);
      }
      if (context?.previousSummary) {
        queryClient.setQueryData(CART_QUERY_KEYS.summary(), context.previousSummary);
      }
      toast.error(error?.message || "Failed to update quantity");
    },

    onSettled: () => {
      // Always refetch to ensure sync
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEYS.items() });
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEYS.summary() });
    },
  });
};

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cartItemId: string) => $removeFromCart({ data: { cartItemId } }),

    // Optimistic update
    onMutate: async (cartItemId) => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEYS.items() });
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEYS.summary() });

      const previousItems = queryClient.getQueryData(CART_QUERY_KEYS.items());
      const previousSummary = queryClient.getQueryData(CART_QUERY_KEYS.summary());

      // Optimistically remove item
      queryClient.setQueryData(CART_QUERY_KEYS.items(), (old: CartItem[] | undefined) => {
        if (!old) return old;
        return old.filter((item) => item.id !== cartItemId);
      });

      // Update summary
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueryData(CART_QUERY_KEYS.summary(), (old: any) => {
        if (!old || !previousItems) return old;

        const items = previousItems as CartItem[];
        const removedItem = items.find((item) => item.id === cartItemId);
        if (!removedItem) return old;

        const quantityDiff = removedItem.quantity;
        const priceDiff = parseFloat(removedItem.product.price) * quantityDiff;

        return {
          itemCount: Math.max(0, old.itemCount - quantityDiff),
          totalPrice: Math.max(0, parseFloat(old.totalPrice) - priceDiff).toFixed(2),
        };
      });

      return { previousItems, previousSummary };
    },

    onError: (error: Error, _cartItemId, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(CART_QUERY_KEYS.items(), context.previousItems);
      }
      if (context?.previousSummary) {
        queryClient.setQueryData(CART_QUERY_KEYS.summary(), context.previousSummary);
      }
      toast.error(error?.message || "Failed to remove item");
    },

    onSuccess: () => {
      toast.success("Removed from cart");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEYS.items() });
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEYS.summary() });
    },
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => $clearCart(),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEYS.all });
      toast.success("Cart cleared");
    },

    onError: (error: Error) => {
      toast.error(error?.message || "Failed to clear cart");
    },
  });
};
