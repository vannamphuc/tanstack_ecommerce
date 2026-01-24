import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ShoppingCart, Store } from "lucide-react";
import { SignOutButton } from "~/components/sign-out-button";
import { ThemeToggle } from "~/components/theme-toggle";
import { Badge } from "~/components/ui/badge";
import { Button, buttonVariants } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { authQueryOptions } from "~/lib/auth/queries";
import { useCartSummary } from "~/lib/cart/queries";

export function SiteHeader() {
  const { data: user } = useQuery(authQueryOptions());
  const { data: cartSummary } = useCartSummary();

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link
          to="/"
          className="hover:text-primary flex items-center gap-2 text-xl font-bold"
        >
          <Store className="h-6 w-6" />
          <span>Shop</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6">
          <Link
            to="/products"
            className="text-foreground/60 hover:text-foreground text-sm font-medium transition-colors"
            activeProps={{ className: "text-foreground" }}
          >
            Products
          </Link>

          {/* Orders link will be added in Phase 3 */}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Cart Button with Badge */}
          {user && (
            <Button
              variant="ghost"
              size="icon"
              render={<Link to="/cart" />}
              className="relative"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartSummary && cartSummary.itemCount > 0 && (
                <Badge
                  className="absolute -top-1 -right-1 h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs"
                  variant="destructive"
                >
                  {cartSummary.itemCount}
                </Badge>
              )}
              <span className="sr-only">Shopping Cart</span>
            </Button>
          )}

          <ThemeToggle />

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                {user.name}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <SignOutButton />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" render={<Link to="/login" />}>
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
