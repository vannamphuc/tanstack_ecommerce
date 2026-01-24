import type { CartSummary } from "~/lib/cart/types";

interface CheckoutSummaryProps {
  cartSummary: CartSummary | undefined;
}

export function CheckoutSummary({ cartSummary }: CheckoutSummaryProps) {
  if (!cartSummary) {
    return null;
  }

  const subtotal = parseFloat(cartSummary.totalPrice);
  const shipping = subtotal >= 50 ? 0 : 5.99;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  return (
    <div className="bg-card rounded-lg border p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">Order Summary</h2>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Subtotal ({cartSummary.itemCount}{" "}
            {cartSummary.itemCount === 1 ? "item" : "items"})
          </span>
          <span className="font-medium">${subtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Shipping</span>
          <span className="font-medium">
            {shipping === 0 ? (
              <span className="text-green-600">FREE</span>
            ) : (
              `$${shipping.toFixed(2)}`
            )}
          </span>
        </div>

        {subtotal < 50 && (
          <p className="text-muted-foreground text-xs">
            Add ${(50 - subtotal).toFixed(2)} more for free shipping
          </p>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Estimated Tax</span>
          <span className="font-medium">${tax.toFixed(2)}</span>
        </div>

        <div className="border-t pt-3">
          <div className="flex justify-between">
            <span className="text-base font-semibold">Total</span>
            <span className="text-lg font-bold">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="bg-muted/50 mt-6 rounded-md p-3">
        <p className="text-muted-foreground text-xs">
          This is a demo checkout. No payment will be processed.
        </p>
      </div>
    </div>
  );
}
