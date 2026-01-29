import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Suspense, useState } from "react";
import { AddToCartButton } from "~/components/cart/add-to-cart-button";
import { ProductDetails } from "~/components/products/product-details";
import { ProductImageGallery } from "~/components/products/product-image-gallery";
import { QuantitySelector } from "~/components/products/quantity-selector";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { createProductQueryOptions, useProductSuspense } from "~/lib/products/queries";

export const Route = createFileRoute("/products/$productId")({
  loader: async ({ params, context: { queryClient } }) => {
    try {
      const product = queryClient.prefetchQuery(
        createProductQueryOptions(params.productId),
      );
      return { product };
    } catch (error) {
      if (error instanceof Error && error.message === "Product not found") {
        throw notFound();
      }
      throw error;
    }
  },
  pendingComponent: () => <ProductDetailSkeleton />,
  component: ProductDetailPage,
  notFoundComponent: () => (
    <div className="container mx-auto flex min-h-100 flex-col items-center justify-center px-4 py-12">
      <h2 className="text-2xl font-bold">Product not found</h2>
      <p className="text-muted-foreground mt-2">
        The product you're looking for doesn't exist or has been removed.
      </p>
      <Button className="mt-6" render={<Link to="/products" />}>
        Browse Products
      </Button>
    </div>
  ),
});

function ProductDetailPage() {
  const { productId } = Route.useParams();

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" className="mb-6 gap-2" render={<Link to="/products" />}>
        <ArrowLeft className="h-4 w-4" />
        Back to Products
      </Button>

      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetailContent productId={productId} />
      </Suspense>
    </div>
  );
}

interface ProductDetailContentProps {
  productId: string;
}

function ProductDetailContent({ productId }: ProductDetailContentProps) {
  const { data: product } = useProductSuspense(productId);
  const [quantity, setQuantity] = useState(1);

  const isOutOfStock = product.stock === 0;
  const maxQuantity = Math.min(product.stock, 99);

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* Left Column - Image Gallery */}
      <ProductImageGallery product={product} />

      {/* Right Column - Product Details */}
      <div className="flex flex-col">
        <ProductDetails product={product} />

        {/* Add to Cart Section */}
        <div className="mt-8 space-y-4 border-t pt-6">
          <div className="flex items-center gap-4">
            <label htmlFor="quantity" className="text-sm font-medium">
              Quantity:
            </label>
            <QuantitySelector
              value={quantity}
              onChange={setQuantity}
              min={1}
              max={maxQuantity}
              disabled={isOutOfStock}
            />
          </div>

          <AddToCartButton
            productId={product.id}
            quantity={quantity}
            disabled={isOutOfStock}
            size="lg"
            className="w-full"
          />

          {!isOutOfStock && (
            <p className="text-muted-foreground text-center text-sm">
              Free shipping on orders over $50
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="mb-6 h-10 w-40" />
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-6 w-40" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Skeleton className="mt-8 h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
