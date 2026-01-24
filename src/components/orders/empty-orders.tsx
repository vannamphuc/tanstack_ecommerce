import { Link } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { Button } from "~/components/ui/button";

export function EmptyOrders() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
      <div className="bg-muted mb-4 flex h-20 w-20 items-center justify-center rounded-full">
        <Package className="text-muted-foreground h-10 w-10" />
      </div>
      <h3 className="mb-2 text-xl font-semibold">No orders yet</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        You haven't placed any orders yet. Start shopping to see your orders here.
      </p>
      <Button render={<Link to="/products" />}>Browse Products</Button>
    </div>
  );
}
