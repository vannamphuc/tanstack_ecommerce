import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { Suspense } from "react";
import { z } from "zod";
import { CheckoutSummary } from "~/components/checkout/checkout-summary";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import { createCartSummaryQueryOptions, useCartSummary } from "~/lib/cart/queries";
import { useCreateOrder } from "~/lib/orders/queries";

/**
 * Checkout form validation schema
 */
const checkoutValidationSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  street: z.string().min(5, "Street address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().length(2, "State must be 2 characters"),
  postalCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid postal code format"),
  phone: z
    .string()
    .regex(
      /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
      "Invalid phone number format",
    ),
  saveAddress: z.boolean(),
});

export const Route = createFileRoute("/_auth/checkout/")({
  loader: async ({ context: { queryClient } }) => {
    const cartSummary = await queryClient.ensureQueryData(
      createCartSummaryQueryOptions(),
    );

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
    },
    validators: {
      onSubmit: checkoutValidationSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const result = await createOrderMutation.mutateAsync({
          shippingAddress: {
            fullName: value.fullName,
            street: value.street,
            city: value.city,
            state: value.state.toUpperCase(),
            postalCode: value.postalCode,
            country: "US",
            phone: value.phone,
          },
          saveAddress: value.saveAddress,
        });

        navigate({
          to: "/orders/$orderId/confirmation",
          params: { orderId: result.id },
        });
      } catch (error) {
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
            <FieldGroup>
              {/* Full Name */}
              <form.Field
                name="fullName"
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Full Name <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="John Doe"
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              />

              {/* Street Address */}
              <form.Field
                name="street"
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Street Address <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="123 Main St"
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              />

              {/* City and State Row */}
              <div className="grid gap-4 sm:grid-cols-2">
                <form.Field
                  name="city"
                  children={(field) => {
                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                          City <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="New York"
                        />
                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    );
                  }}
                />

                <form.Field
                  name="state"
                  children={(field) => {
                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                          State <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                          aria-invalid={isInvalid}
                          placeholder="NY"
                          maxLength={2}
                        />
                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    );
                  }}
                />
              </div>

              {/* Postal Code and Phone Row */}
              <div className="grid gap-4 sm:grid-cols-2">
                <form.Field
                  name="postalCode"
                  children={(field) => {
                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                          Postal Code <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="10001"
                        />
                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    );
                  }}
                />

                <form.Field
                  name="phone"
                  children={(field) => {
                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                          Phone Number <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="tel"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="(555) 123-4567"
                        />
                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    );
                  }}
                />
              </div>

              {/* Save Address Checkbox */}
              <form.Field
                name="saveAddress"
                children={(field) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={field.name}
                      checked={field.state.value}
                      onCheckedChange={(checked) =>
                        field.handleChange(checked === true)
                      }
                    />
                    <FieldLabel htmlFor={field.name} className="cursor-pointer font-normal">
                      Save this address for future orders
                    </FieldLabel>
                  </div>
                )}
              />
            </FieldGroup>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-between">
              <Button type="button" variant="outline" render={<Link to="/cart" />}>
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
