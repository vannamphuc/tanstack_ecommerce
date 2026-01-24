import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import {
  createFeaturedProductsQueryOptions,
  createCategoriesQueryOptions,
  useFeaturedProductsSuspense,
  useCategoriesSuspense,
} from "~/lib/products/queries";
import { HeroSection } from "~/components/home/hero-section";
import { FeaturedProductsSection } from "~/components/home/featured-products";
import { CategoryShowcase } from "~/components/home/category-showcase";
import { Skeleton } from "~/components/ui/skeleton";

export const Route = createFileRoute("/")({
  loader: ({ context: { queryClient } }) => {
    // Prefetch featured products and categories in parallel
    queryClient.prefetchQuery(createFeaturedProductsQueryOptions());
    queryClient.prefetchQuery(createCategoriesQueryOptions());
  },
  component: HomePage,
});

function HomePage() {
  return (
    <div>
      <HeroSection />
      <Suspense fallback={<HomeContentSkeleton />}>
        <HomeContent />
      </Suspense>
    </div>
  );
}

function HomeContent() {
  const { data: featuredProducts } = useFeaturedProductsSuspense();
  const { data: categories } = useCategoriesSuspense();

  return (
    <>
      <FeaturedProductsSection products={featuredProducts} />
      <CategoryShowcase categories={categories} />
    </>
  );
}

function HomeContentSkeleton() {
  return (
    <div className="py-16">
      <div className="container mx-auto px-4">
        <Skeleton className="mb-8 h-10 w-64" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    </div>
  );
}
