import type { OrderItem } from "~/lib/orders/types";

interface OrderItemCardProps {
  item: OrderItem;
}

export function OrderItemCard({ item }: OrderItemCardProps) {
  const itemTotal = parseFloat(item.price) * item.quantity;

  return (
    <div className="flex gap-4 rounded-lg border p-4">
      {/* Product Image */}
      <div className="relative flex-shrink-0">
        <img
          src={item.product.images[0]?.url || "/placeholder.png"}
          alt={item.product.name}
          className="h-24 w-24 rounded-md border object-cover"
        />
        {item.quantity > 1 && (
          <div className="bg-primary text-primary-foreground absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold">
            {item.quantity}
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <h3 className="font-semibold">{item.product.name}</h3>
          <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
            {item.product.description}
          </p>
        </div>

        <div className="mt-2 flex items-end justify-between">
          <div className="text-muted-foreground text-sm">
            <span>
              ${parseFloat(item.price).toFixed(2)} × {item.quantity}
            </span>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">${itemTotal.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
