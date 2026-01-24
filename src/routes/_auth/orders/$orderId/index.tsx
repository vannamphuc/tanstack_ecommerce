import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Package } from "lucide-react";
import { Suspense } from "react";
import { OrderItemCard } from "~/components/orders/order-item-card";
import { OrderStatusBadge } from "~/components/orders/order-status-badge";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { createOrderQueryOptions, useOrderSuspense } from "~/lib/orders/queries";
import type { OrderStatus } from "~/lib/orders/types";

export const Route = createFileRoute("/_auth/orders/$orderId/")({
  loader: async ({ params, context: { queryClient } }) => {
    try {
      await queryClient.ensureQueryData(createOrderQueryOptions(params.orderId));
    } catch (error) {
      if (error instanceof Error && error.message === "Order not found") {
        throw notFound();
      }
      throw error;
    }
  },
  pendingComponent: () => <OrderDetailSkeleton />,
  component: OrderDetailPage,
  notFoundComponent: () => (
    <div className="container mx-auto flex min-h-100 flex-col items-center justify-center px-4 py-12">
      <div className="bg-muted mb-6 flex h-20 w-20 items-center justify-center rounded-full">
        <Package className="text-muted-foreground h-10 w-10" />
      </div>
      <h2 className="text-2xl font-bold">Order not found</h2>
      <p className="text-muted-foreground mt-2 text-center">
        The order you're looking for doesn't exist or you don't have access to it.
      </p>
      <Button className="mt-6" render={<Link to="/orders" />}>
        View All Orders
      </Button>
    </div>
  ),
});

function OrderDetailPage() {
  const { orderId } = Route.useParams();

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" className="mb-6 gap-2" render={<Link to="/orders" />}>
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
      </Button>

      <Suspense fallback={<OrderDetailSkeleton />}>
        <OrderDetailContent orderId={orderId} />
      </Suspense>
    </div>
  );
}

interface OrderDetailContentProps {
  orderId: string;
}

function OrderDetailContent({ orderId }: OrderDetailContentProps) {
  const { data: order } = useOrderSuspense(orderId);

  const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = parseFloat(order.total);

  return (
    <div className="space-y-8">
      {/* Order Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <h1 className="font-mono text-2xl font-bold">{order.orderNumber}</h1>
            <OrderStatusBadge status={order.status as OrderStatus} />
          </div>
          <p className="text-muted-foreground">Placed on {orderDate}</p>
        </div>
      </div>

      {/* Order Items */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">
          Order Items ({itemCount} {itemCount === 1 ? "item" : "items"})
        </h2>
        <div className="space-y-3">
          {order.items.map((item) => (
            <OrderItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* Order Summary and Shipping Address */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Order Summary */}
        <div className="bg-card rounded-lg border p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Order Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium text-green-600">FREE</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span className="font-medium">Included</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold">${subtotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-card rounded-lg border p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Shipping Address</h2>
          <div className="text-muted-foreground space-y-1 text-sm">
            <p className="text-foreground font-medium">
              {order.shippingAddress.fullName}
            </p>
            <p>{order.shippingAddress.street}</p>
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.postalCode}
            </p>
            <p className="pt-2">{order.shippingAddress.phone}</p>
          </div>
        </div>
      </div>

      {/* Demo Notice */}
      <div className="rounded-lg bg-blue-50 p-4 text-blue-900 dark:bg-blue-950/20 dark:text-blue-100">
        <p className="text-sm">
          <strong>Note:</strong> This is a demo order. No actual payment was processed and
          no products will be shipped.
        </p>
      </div>
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="mb-6 h-10 w-40" />
      <div className="space-y-8">
        <div>
          <Skeleton className="mb-2 h-10 w-64" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div>
          <Skeleton className="mb-4 h-8 w-48" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}
