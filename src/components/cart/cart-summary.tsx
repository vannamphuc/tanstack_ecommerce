import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { CartSummary as CartSummaryType } from "~/lib/cart/types";

interface CartSummaryProps {
  summary: CartSummaryType;
  showCheckoutButton?: boolean;
}

export function CartSummary({ summary, showCheckoutButton = true }: CartSummaryProps) {
  const shipping = 0; // Free shipping
  const total = parseFloat(summary.totalPrice) + shipping;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Subtotal ({summary.itemCount} {summary.itemCount === 1 ? "item" : "items"})
          </span>
          <span className="font-medium">${summary.totalPrice}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span className="font-medium">{shipping === 0 ? "FREE" : `$${shipping}`}</span>
        </div>
        <div className="border-t pt-4">
          <div className="flex justify-between">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-lg font-bold">${total.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
      {showCheckoutButton && (
        <CardFooter>
          <Button
            className="w-full"
            size="lg"
            render={<Link to="/checkout" />}
            disabled={summary.itemCount === 0}
          >
            Proceed to Checkout
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
