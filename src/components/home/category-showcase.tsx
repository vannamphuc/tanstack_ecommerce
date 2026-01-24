import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "~/components/ui/card";
import type { Categories } from "~/lib/products/types";

interface CategoryShowcaseProps {
  categories: Categories;
}

export function CategoryShowcase({ categories }: CategoryShowcaseProps) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="bg-muted/50 py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold">Shop by Category</h2>
          <p className="text-muted-foreground mt-2">
            Explore our wide range of product categories
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              to="/products"
              search={{ category: category.id }}
              className="group block"
            >
              <Card className="overflow-hidden transition-shadow hover:shadow-lg">
                <CardContent className="p-0">
                  <div className="relative aspect-video overflow-hidden bg-gray-100">
                    {category.image && (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold group-hover:text-primary">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-muted-foreground mt-1 text-sm line-clamp-2">
                        {category.description}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
