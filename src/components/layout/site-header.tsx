import { Link } from "@tanstack/react-router";
import { ShoppingCart, Store } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { ThemeToggle } from "~/components/theme-toggle";
import { SignOutButton } from "~/components/sign-out-button";
import { useQuery } from "@tanstack/react-query";
import { authQueryOptions } from "~/lib/auth/queries";

export function SiteHeader() {
  const { data: user } = useQuery(authQueryOptions());

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-xl font-bold hover:text-primary">
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
          {/* Cart Button - Will be implemented in Phase 2 */}
          {user && (
            <Button variant="ghost" size="icon" disabled>
              <ShoppingCart className="h-5 w-5" />
              <span className="sr-only">Shopping Cart (Coming Soon)</span>
            </Button>
          )}

          <ThemeToggle />

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="outline" size="sm">
                  {user.name}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Link to="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                {/* Orders will be added in Phase 3 */}
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <SignOutButton />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              size="sm"
              render={<Link to="/login" />}
              nativeButton={false}
            >
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
