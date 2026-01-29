import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { CategoryShowcase } from "~/components/home/category-showcase";
import { FeaturedProductsSection } from "~/components/home/featured-products";
import { HeroSection } from "~/components/home/hero-section";
import { Skeleton } from "~/components/ui/skeleton";
import {
  createCategoriesQueryOptions,
  createFeaturedProductsQueryOptions,
  useCategoriesSuspense,
  useFeaturedProductsSuspense,
} from "~/lib/products/queries";

export const Route = createFileRoute("/")({
  loader: ({ context: { queryClient } }) => {
    // Prefetch featured products and categories in parallel
    queryClient.prefetchQuery(createFeaturedProductsQueryOptions());
    queryClient.prefetchQuery(createCategoriesQueryOptions());
  },
  head: () => ({
    meta: [
      { title: "Home | Shop Premium Products Online" },
      {
        name: "description",
        content:
          "Welcome to My App Store - browse featured products and shop premium items across multiple categories.",
      },
      // Open Graph
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Home | Shop Premium Products Online" },
      {
        property: "og:description",
        content: "Browse featured products and shop premium items.",
      },
      { property: "og:url", content: "https://myapp-1-zeta.vercel.app/" },
      { property: "og:image", content: "https://myapp-1-zeta.vercel.app/logo.png" },
      // Twitter
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://myapp-1-zeta.vercel.app/" }],
  }),
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
