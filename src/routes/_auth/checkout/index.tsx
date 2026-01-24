import { useForm } from "@tanstack/react-form";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Suspense } from "react";
import { AddressFormFields } from "~/components/checkout/address-form-fields";
import { CheckoutSummary } from "~/components/checkout/checkout-summary";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { createCartSummaryQueryOptions, useCartSummary } from "~/lib/cart/queries";
import { useCreateOrder } from "~/lib/orders/queries";

/**
 * Checkout form data type
 */
type CheckoutFormData = {
  fullName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  saveAddress: boolean;
};

export const Route = createFileRoute("/_auth/checkout/")({
  loader: async ({ context: { queryClient } }) => {
    // Prefetch cart summary
    const cartSummary = await queryClient.ensureQueryData(
      createCartSummaryQueryOptions(),
    );

    // Redirect if cart is empty
    if (!cartSummary || cartSummary.itemCount === 0) {
      throw redirect({ to: "/cart" });
    }

    return { cartSummary };
  },
  pendingComponent: () => <CheckoutSkeleton />,
  component: CheckoutPage,
});

function CheckoutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Checkout</h1>

      <Suspense fallback={<CheckoutSkeleton />}>
        <CheckoutContent />
      </Suspense>
    </div>
  );
}

function CheckoutContent() {
  const navigate = useNavigate();
  const { data: cartSummary } = useCartSummary();
  const createOrderMutation = useCreateOrder();

  const form = useForm({
    defaultValues: {
      fullName: "",
      street: "",
      city: "",
      state: "",
      postalCode: "",
      phone: "",
      saveAddress: false,
    } as CheckoutFormData,
    onSubmit: async ({ value }) => {
      try {
        const result = await createOrderMutation.mutateAsync({
          shippingAddress: {
            fullName: value.fullName,
            street: value.street,
            city: value.city,
            state: value.state,
            postalCode: value.postalCode,
            country: "US",
            phone: value.phone,
          },
          saveAddress: value.saveAddress,
        });

        // Navigate to order confirmation page
        navigate({
          to: "/orders/$orderId/confirmation",
          params: { orderId: result.id },
        });
      } catch (error) {
        // Error is handled by mutation hook with toast
        console.error("Order creation failed:", error);
      }
    },
  });

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Left Column - Shipping Form */}
      <div className="lg:col-span-2">
        <div className="bg-card rounded-lg border p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold">Shipping Information</h2>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <AddressFormFields form={form} showSaveAddress={true} />

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="outline"
                render={
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate({ to: "/cart" });
                    }}
                  />
                }
              >
                Back to Cart
              </Button>

              <Button
                type="submit"
                disabled={createOrderMutation.isPending}
                className="sm:min-w-[200px]"
              >
                {createOrderMutation.isPending ? "Placing Order..." : "Place Order"}
              </Button>
            </div>

            {form.state.errors.length > 0 && (
              <div className="bg-destructive/10 text-destructive mt-4 rounded-md p-3">
                <p className="text-sm font-medium">
                  Please fix the errors above before submitting.
                </p>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Right Column - Order Summary */}
      <div className="lg:col-span-1">
        <CheckoutSummary cartSummary={cartSummary} />
      </div>
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="mb-8 h-10 w-48" />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
            <Skeleton className="h-12 w-48" />
          </div>
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}
