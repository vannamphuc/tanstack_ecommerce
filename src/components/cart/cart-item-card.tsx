import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { QuantitySelector } from "~/components/products/quantity-selector";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { useRemoveFromCart, useUpdateCartQuantity } from "~/lib/cart/queries";
import type { CartItem } from "~/lib/cart/types";

interface CartItemCardProps {
  item: CartItem;
}

export function CartItemCard({ item }: CartItemCardProps) {
  const updateQuantityMutation = useUpdateCartQuantity();
  const removeItemMutation = useRemoveFromCart();

  const firstImage = item.product.images[0];
  const imageUrl =
    firstImage?.url ||
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop";
  const imageAlt = firstImage?.alt || item.product.name;

  const itemTotal = (parseFloat(item.product.price) * item.quantity).toFixed(2);
  const isOutOfStock = item.product.stock === 0;
  const maxQuantity = Math.min(item.product.stock, 99);

  const handleQuantityChange = (newQuantity: number) => {
    updateQuantityMutation.mutate({
      cartItemId: item.id,
      quantity: newQuantity,
    });
  };

  const handleRemove = () => {
    removeItemMutation.mutate(item.id);
  };

  return (
    <Card className={isOutOfStock ? "opacity-60" : ""}>
      <CardContent className="flex gap-4 p-4">
        {/* Product Image */}
        <Link
          to="/products/$productId"
          params={{ productId: item.product.id }}
          className="shrink-0"
        >
          <div className="h-24 w-24 overflow-hidden rounded-md bg-gray-100">
            <img src={imageUrl} alt={imageAlt} className="h-full w-full object-cover" />
          </div>
        </Link>

        {/* Product Info */}
        <div className="flex flex-1 flex-col justify-between">
          <div>
            <Link
              to="/products/$productId"
              params={{ productId: item.product.id }}
              className="hover:text-primary font-medium"
            >
              {item.product.name}
            </Link>
            {item.product.category && (
              <p className="text-muted-foreground mt-1 text-sm">
                {item.product.category.name}
              </p>
            )}
            <p className="mt-1 font-semibold">${item.product.price}</p>
          </div>

          {/* Quantity Controls */}
          <div className="mt-2 flex items-center gap-4">
            {!isOutOfStock ? (
              <QuantitySelector
                value={item.quantity}
                onChange={handleQuantityChange}
                min={1}
                max={maxQuantity}
                disabled={
                  updateQuantityMutation.isPending || removeItemMutation.isPending
                }
              />
            ) : (
              <span className="text-destructive text-sm font-medium">Out of Stock</span>
            )}

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleRemove}
              disabled={removeItemMutation.isPending}
              aria-label="Remove from cart"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Item Total */}
        <div className="text-right">
          <p className="font-semibold">${itemTotal}</p>
          {item.quantity > 1 && (
            <p className="text-muted-foreground text-sm">${item.product.price} each</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
