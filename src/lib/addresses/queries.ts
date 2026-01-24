import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { ADDRESS_QUERY_KEYS } from "~/lib/queries/query-keys";
import {
  $createAddress,
  $deleteAddress,
  $getAddresses,
  $updateAddress,
} from "./functions";
import type { AddressInput } from "./types";

/**
 * Query Options Factories
 */

export const createAddressesQueryOptions = () =>
  queryOptions({
    queryKey: ADDRESS_QUERY_KEYS.list(),
    queryFn: ({ signal }) => $getAddresses({ signal }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

/**
 * Query Hooks
 */

export const useAddresses = () => {
  return useQuery(createAddressesQueryOptions());
};

export const useAddressesSuspense = () => {
  return useSuspenseQuery(createAddressesQueryOptions());
};

/**
 * Mutation Hooks
 */

export const useCreateAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddressInput) => $createAddress({ data }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESS_QUERY_KEYS.all });
      toast.success("Address saved successfully");
    },

    onError: (error: Error) => {
      toast.error(error?.message || "Failed to save address");
    },
  });
};

export const useUpdateAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddressInput & { addressId: string }) => $updateAddress({ data }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESS_QUERY_KEYS.all });
      toast.success("Address updated successfully");
    },

    onError: (error: Error) => {
      toast.error(error?.message || "Failed to update address");
    },
  });
};

export const useDeleteAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (addressId: string) => $deleteAddress({ data: { addressId } }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESS_QUERY_KEYS.all });
      toast.success("Address deleted successfully");
    },

    onError: (error: Error) => {
      toast.error(error?.message || "Failed to delete address");
    },
  });
};
