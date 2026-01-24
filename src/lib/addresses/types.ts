import type { $createAddress, $getAddresses, $updateAddress } from "./functions";

/**
 * Type Exports for Addresses
 */
export type Addresses = Awaited<ReturnType<typeof $getAddresses>>;
export type Address = Addresses[number];

export type CreateAddressResult = Awaited<ReturnType<typeof $createAddress>>;
export type UpdateAddressResult = Awaited<ReturnType<typeof $updateAddress>>;

/**
 * Address input type
 */
export interface AddressInput {
  fullName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  phone: string;
  isDefault?: boolean;
}
