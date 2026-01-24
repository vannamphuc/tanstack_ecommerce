import { useQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import { Button } from "~/components/ui/button";
import { authQueryOptions } from "~/lib/auth/queries";
import { useAddToCart } from "~/lib/cart/queries";

interface AddToCartButtonProps {
  productId: string;
  quantity?: number;
  disabled?: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function AddToCartButton({
  productId,
  quantity = 1,
  disabled = false,
  variant = "default",
  size = "default",
  className,
}: AddToCartButtonProps) {
  const router = useRouter();
  const { data: user } = useQuery(authQueryOptions());
  const addToCartMutation = useAddToCart();

  const handleClick = () => {
    // Redirect to login if not authenticated
    if (!user) {
      router.navigate({
        to: "/login",
        search: { redirect: window.location.pathname },
      });
      return;
    }

    // Add to cart
    addToCartMutation.mutate({
      productId,
      quantity,
    });
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={disabled || addToCartMutation.isPending}
    >
      <ShoppingCart className="h-4 w-4" />
      {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
    </Button>
  );
}
