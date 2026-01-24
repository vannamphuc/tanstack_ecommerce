import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { z } from "zod";
import { ProductFilters } from "~/components/products/product-filters";
import { ProductGrid } from "~/components/products/product-grid";
import { ProductListSkeleton } from "~/components/products/product-list-skeleton";
import {
  createCategoriesQueryOptions,
  createProductsQueryOptions,
  useCategoriesSuspense,
  useProductsSuspense,
} from "~/lib/products/queries";

// Search params schema
const productSearchSchema = z.object({
  category: z.string().optional(),
});

export const Route = createFileRoute("/products/")({
  validateSearch: productSearchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ context: { queryClient }, deps: { search } }) => {
    // Prefetch products and categories in parallel
    queryClient.prefetchQuery(createProductsQueryOptions(search.category));
    queryClient.prefetchQuery(createCategoriesQueryOptions());
  },
  pendingComponent: () => (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
      </div>
      <ProductListSkeleton />
    </div>
  ),
  component: ProductsPage,
});

function ProductsPage() {
  const { category } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold">Products</h1>
        <p className="text-muted-foreground">Browse our collection of quality products</p>
      </div>

      <Suspense fallback={<ProductListSkeleton />}>
        <ProductListContent
          categoryId={category}
          onCategoryChange={(newCategoryId) => {
            navigate({
              search: (prev) => ({
                ...prev,
                category: newCategoryId,
              }),
            });
          }}
        />
      </Suspense>
    </div>
  );
}

interface ProductListContentProps {
  categoryId?: string;
  onCategoryChange: (categoryId: string | undefined) => void;
}

function ProductListContent({ categoryId, onCategoryChange }: ProductListContentProps) {
  const { data: products } = useProductsSuspense(categoryId);
  const { data: categories } = useCategoriesSuspense();

  return (
    <>
      <ProductFilters
        categories={categories}
        selectedCategoryId={categoryId}
        onCategoryChange={onCategoryChange}
      />
      <ProductGrid products={products} />
    </>
  );
}
