import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import type { Order, OrderStatus } from "~/lib/orders/types";
import { OrderStatusBadge } from "./order-status-badge";

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-card rounded-lg border p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Order Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h3 className="font-mono text-sm font-semibold">{order.orderNumber}</h3>
            <OrderStatusBadge status={order.status as OrderStatus} />
          </div>
          <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span>Placed on {orderDate}</span>
            <span className="hidden sm:inline">•</span>
            <span>
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="text-foreground font-semibold">
              ${parseFloat(order.total).toFixed(2)}
            </span>
          </div>
        </div>

        {/* View Details Button */}
        <Button
          variant="outline"
          size="sm"
          render={<Link to="/orders/$orderId" params={{ orderId: order.id }} />}
          className="gap-2"
        >
          View Details
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Order Items Preview */}
      {order.items.length > 0 && (
        <div className="mt-4 flex gap-2 border-t pt-4">
          {order.items.slice(0, 3).map((item) => (
            <div key={item.id} className="relative">
              <img
                src={item.product.images[0]?.url || "/placeholder.png"}
                alt={item.product.name}
                className="h-16 w-16 rounded-md border object-cover"
              />
              {item.quantity > 1 && (
                <div className="bg-primary text-primary-foreground absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold">
                  {item.quantity}
                </div>
              )}
            </div>
          ))}
          {order.items.length > 3 && (
            <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-md border text-sm font-medium">
              +{order.items.length - 3}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
