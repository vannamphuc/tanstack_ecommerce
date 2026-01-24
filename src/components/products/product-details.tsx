import { Badge } from "~/components/ui/badge";
import type { Product } from "~/lib/products/types";

interface ProductDetailsProps {
  product: Product;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 10;

  return (
    <div className="space-y-6">
      {/* Product Name */}
      <div>
        <h1 className="mb-2 text-3xl font-bold">{product.name}</h1>
        {product.category && (
          <p className="text-muted-foreground text-sm">{product.category.name}</p>
        )}
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold">${product.price}</span>
      </div>

      {/* Stock Status */}
      <div className="flex items-center gap-2">
        {isOutOfStock && <Badge variant="destructive">Out of Stock</Badge>}
        {isLowStock && (
          <Badge variant="outline" className="border-orange-500 text-orange-500">
            Only {product.stock} left in stock
          </Badge>
        )}
        {product.featured && <Badge>Featured</Badge>}
      </div>

      {/* Description */}
      <div>
        <h2 className="mb-2 text-lg font-semibold">Description</h2>
        <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
          {product.description}
        </p>
      </div>
    </div>
  );
}
