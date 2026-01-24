import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";
import { CartItemCard } from "~/components/cart/cart-item-card";
import { CartSummary } from "~/components/cart/cart-summary";
import { EmptyCart } from "~/components/cart/empty-cart";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import {
  createCartItemsQueryOptions,
  createCartSummaryQueryOptions,
  useCartItemsSuspense,
  useCartSummary,
} from "~/lib/cart/queries";

export const Route = createFileRoute("/_auth/cart/")({
  loader: ({ context: { queryClient } }) => {
    // Prefetch cart data
    queryClient.prefetchQuery(createCartItemsQueryOptions());
    queryClient.prefetchQuery(createCartSummaryQueryOptions());
  },
  component: CartPage,
});

function CartPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" className="mb-6 gap-2" render={<Link to="/products" />}>
        <ArrowLeft className="h-4 w-4" />
        Continue Shopping
      </Button>

      <h1 className="mb-8 text-3xl font-bold">Shopping Cart</h1>

      <Suspense fallback={<CartSkeleton />}>
        <CartContent />
      </Suspense>
    </div>
  );
}

function CartContent() {
  const { data: items } = useCartItemsSuspense();
  const { data: summary } = useCartSummary();

  if (items.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Cart Items */}
      <div className="space-y-4 lg:col-span-2">
        {items.map((item) => (
          <CartItemCard key={item.id} item={item} />
        ))}
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-1">
        {summary && <CartSummary summary={summary} showCheckoutButton />}
      </div>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      <div className="lg:col-span-1">
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
