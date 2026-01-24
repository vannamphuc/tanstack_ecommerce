import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Suspense } from "react";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { createOrderQueryOptions, useOrderSuspense } from "~/lib/orders/queries";

export const Route = createFileRoute("/_auth/orders/$orderId/confirmation")({
  loader: async ({ params, context: { queryClient } }) => {
    await queryClient.ensureQueryData(createOrderQueryOptions(params.orderId));
  },
  pendingComponent: () => <ConfirmationSkeleton />,
  component: OrderConfirmationPage,
});

function OrderConfirmationPage() {
  const { orderId } = Route.useParams();

  return (
    <div className="container mx-auto px-4 py-12">
      <Suspense fallback={<ConfirmationSkeleton />}>
        <OrderConfirmationContent orderId={orderId} />
      </Suspense>
    </div>
  );
}

interface OrderConfirmationContentProps {
  orderId: string;
}

function OrderConfirmationContent({ orderId }: OrderConfirmationContentProps) {
  const { data: order } = useOrderSuspense(orderId);

  return (
    <div className="mx-auto max-w-2xl text-center">
      {/* Success Icon */}
      <div className="mb-6 flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle2 className="h-12 w-12" />
        </div>
      </div>

      {/* Success Message */}
      <h1 className="mb-4 text-3xl font-bold">Order Placed Successfully!</h1>
      <p className="text-muted-foreground mb-8 text-lg">
        Thank you for your order. We've received your order and will process it shortly.
      </p>

      {/* Order Details Card */}
      <div className="bg-muted/50 mb-8 rounded-lg border p-6 text-left">
        <h2 className="mb-4 text-lg font-semibold">Order Details</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Order Number:</span>
            <span className="font-mono font-semibold">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Order Date:</span>
            <span className="font-medium">
              {new Date(order.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <span className="font-medium capitalize">{order.status}</span>
          </div>
          <div className="mt-2 border-t pt-2">
            <div className="flex justify-between text-base">
              <span className="font-semibold">Total:</span>
              <span className="font-bold">${parseFloat(order.total).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="bg-muted/50 mb-8 rounded-lg border p-6 text-left">
        <h2 className="mb-4 text-lg font-semibold">Shipping Address</h2>
        <div className="text-muted-foreground space-y-1 text-sm">
          <p className="text-foreground font-medium">{order.shippingAddress.fullName}</p>
          <p>{order.shippingAddress.street}</p>
          <p>
            {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
            {order.shippingAddress.postalCode}
          </p>
          <p>{order.shippingAddress.phone}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
        <Button size="lg" render={<Link to="/orders/$orderId" params={{ orderId }} />}>
          View Order Details
        </Button>
        <Button size="lg" variant="outline" render={<Link to="/products" />}>
          Continue Shopping
        </Button>
      </div>

      {/* Info Message */}
      <div className="mt-8 rounded-lg bg-blue-50 p-4 text-blue-900 dark:bg-blue-950/20 dark:text-blue-100">
        <p className="text-sm">
          <strong>Note:</strong> This is a demo e-commerce site. No actual payment was
          processed and no products will be shipped.
        </p>
      </div>
    </div>
  );
}

function ConfirmationSkeleton() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-2xl text-center">
        <Skeleton className="mx-auto mb-6 h-20 w-20 rounded-full" />
        <Skeleton className="mx-auto mb-4 h-10 w-96" />
        <Skeleton className="mx-auto mb-8 h-6 w-full max-w-lg" />
        <Skeleton className="mx-auto mb-8 h-48 w-full" />
        <Skeleton className="mx-auto mb-8 h-32 w-full" />
        <div className="flex justify-center gap-4">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-12 w-48" />
        </div>
      </div>
    </div>
  );
}
