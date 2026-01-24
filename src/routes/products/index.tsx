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
  page: z.number().int().min(1).default(1),
});

export const Route = createFileRoute("/products/")({
  validateSearch: productSearchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ context: { queryClient }, deps: { search } }) => {
    // Prefetch products and categories in parallel
    queryClient.prefetchQuery(createProductsQueryOptions(search.category, search.page));
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
  const { category, page } = Route.useSearch();
  const navigate = Route.useNavigate();

  const handlePageChange = (newPage: number) => {
    navigate({
      search: (prev) => ({
        ...prev,
        page: newPage,
      }),
    });
  };

  const handleCategoryChange = (newCategoryId: string | undefined) => {
    navigate({
      search: (prev) => ({
        ...prev,
        category: newCategoryId,
        page: 1, // Reset to first page when category changes
      }),
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold">Products</h1>
        <p className="text-muted-foreground">Browse our collection of quality products</p>
      </div>

      <Suspense fallback={<ProductListSkeleton />}>
        <ProductListContent
          categoryId={category}
          page={page}
          onCategoryChange={handleCategoryChange}
          onPageChange={handlePageChange}
        />
      </Suspense>
    </div>
  );
}

interface ProductListContentProps {
  categoryId?: string;
  page: number;
  onCategoryChange: (categoryId: string | undefined) => void;
  onPageChange: (page: number) => void;
}

function ProductListContent({
  categoryId,
  page,
  onCategoryChange,
  onPageChange,
}: ProductListContentProps) {
  const { data } = useProductsSuspense(categoryId, page);
  const { data: categories } = useCategoriesSuspense();

  return (
    <>
      <ProductFilters
        categories={categories}
        selectedCategoryId={categoryId}
        onCategoryChange={onCategoryChange}
      />
      <ProductGrid products={data.products} />

      {/* Pagination Controls */}
      {data.pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => onPageChange(data.pagination.page - 1)}
            disabled={!data.pagination.hasPrevPage}
            className="rounded-md border px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
          >
            Previous
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`rounded-md px-3 py-2 transition-colors ${
                  p === data.pagination.page
                    ? "bg-primary text-primary-foreground"
                    : "border hover:bg-muted"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={() => onPageChange(data.pagination.page + 1)}
            disabled={!data.pagination.hasNextPage}
            className="rounded-md border px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}
