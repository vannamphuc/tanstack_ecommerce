import { Link } from "@tanstack/react-router";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "~/components/ui/card";
import type { ProductListItem } from "~/lib/products/types";

interface ProductCardProps {
  product: ProductListItem;
}

export function ProductCard({ product }: ProductCardProps) {
  const firstImage = product.images[0];
  const imageUrl =
    firstImage?.url ||
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop";
  const imageAlt = firstImage?.alt || product.name;

  return (
    <Link
      to="/products/$productId"
      params={{ productId: product.id }}
      className="group block"
    >
      <Card className="overflow-hidden transition-shadow hover:shadow-lg">
        <CardHeader className="p-0">
          <div className="relative aspect-square overflow-hidden bg-gray-100">
            <img
              src={imageUrl}
              alt={imageAlt}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
            {product.featured && (
              <Badge className="absolute top-2 right-2">Featured</Badge>
            )}
            {product.stock === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <Badge variant="destructive">Out of Stock</Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <h3 className="group-hover:text-primary mb-1 line-clamp-2 font-semibold">
            {product.name}
          </h3>
          {product.category && (
            <p className="text-muted-foreground mb-2 text-sm">{product.category.name}</p>
          )}
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {product.description}
          </p>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <div className="flex w-full items-center justify-between">
            <span className="text-2xl font-bold">${product.price}</span>
            {product.stock > 0 && product.stock <= 10 && (
              <span className="text-muted-foreground text-xs">
                Only {product.stock} left
              </span>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
