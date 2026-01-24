import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="bg-linear-to-b from-primary/10 to-background py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Welcome to Your Favorite{" "}
            <span className="text-primary">Online Store</span>
          </h1>
          <p className="text-muted-foreground mb-8 text-lg sm:text-xl">
            Discover quality products at unbeatable prices. From electronics to books,
            we have everything you need.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button size="lg" render={<Link to="/products" />} nativeButton={false}>
              Shop Now
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<Link to="/products" />}
              nativeButton={false}
            >
              Browse Categories
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
