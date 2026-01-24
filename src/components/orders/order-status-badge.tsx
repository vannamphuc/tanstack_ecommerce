import { Badge } from "~/components/ui/badge";
import type { OrderStatus } from "~/lib/orders/types";

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

const statusConfig: Record<
  OrderStatus,
  { variant: "default" | "secondary" | "destructive" | "outline"; label: string }
> = {
  pending: {
    variant: "secondary",
    label: "Pending",
  },
  confirmed: {
    variant: "default",
    label: "Confirmed",
  },
  shipped: {
    variant: "outline",
    label: "Shipped",
  },
  delivered: {
    variant: "default",
    label: "Delivered",
  },
  cancelled: {
    variant: "destructive",
    label: "Cancelled",
  },
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className="capitalize">
      {config.label}
    </Badge>
  );
}
