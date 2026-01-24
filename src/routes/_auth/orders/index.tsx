import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { EmptyOrders } from "~/components/orders/empty-orders";
import { OrderCard } from "~/components/orders/order-card";
import { Skeleton } from "~/components/ui/skeleton";
import { createOrdersQueryOptions, useOrdersSuspense } from "~/lib/orders/queries";

export const Route = createFileRoute("/_auth/orders/")({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(createOrdersQueryOptions());
  },
  pendingComponent: () => <OrdersListSkeleton />,
  component: OrdersPage,
});

function OrdersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Orders</h1>
        <p className="text-muted-foreground mt-2">View and track your order history</p>
      </div>

      <Suspense fallback={<OrdersListSkeleton />}>
        <OrdersList />
      </Suspense>
    </div>
  );
}

function OrdersList() {
  const { data: orders } = useOrdersSuspense();

  if (orders.length === 0) {
    return <EmptyOrders />;
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}

function OrdersListSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Skeleton className="mb-2 h-10 w-48" />
        <Skeleton className="h-6 w-64" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
