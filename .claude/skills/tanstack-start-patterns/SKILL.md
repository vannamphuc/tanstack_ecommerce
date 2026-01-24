---
name: tanstack-start-patterns
description: |
  Comprehensive patterns and best practices for TanStack Start full-stack React framework.
  Use when: Building features with TanStack Start, Router, Query, Form.
  Helps with: Server functions, data fetching, route protection, form validation, mutations, SSR.
  Solves: Type-safe full-stack development patterns.
author: Claude Code
version: 1.2.0
date: 2025-01-25
---

# TanStack Start Full-Stack Patterns

## Overview

TanStack Start is a full-stack React framework with type-safe APIs, streaming SSR, and universal deployment. This document covers essential patterns for building production applications.

> **Assumptions**: Examples use PostgreSQL with Drizzle ORM, Better Auth for authentication, and shadcn/ui components. Adjust accordingly for your stack.

---

## 1. Server Functions (`createServerFn`)

### Basic Pattern

```typescript
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { db } from "~/lib/db";
import * as schema from "~/lib/db/schema";

// GET - No input
export const $getProducts = createServerFn({ method: "GET" }).handler(async () => {
  const products = await db.query.product.findMany({
    orderBy: [desc(schema.product.createdAt)],
  });
  return products;
});

// GET - With input validation (Zod)
export const $getProduct = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const product = await db.query.product.findFirst({
      where: eq(schema.product.id, data.id),
      with: { category: true },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    return product;
  });

// POST - With middleware + input validation
export const $addToCart = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().positive(),
    }),
  )
  .handler(async ({ context, data }) => {
    // context.user available from middleware
    // Note: .returning() is PostgreSQL-specific
    // For MySQL, use separate insert + select
    const [cartItem] = await db
      .insert(schema.cart)
      .values({
        id: nanoid(),
        userId: context.user.id,
        productId: data.productId,
        quantity: data.quantity,
      })
      .returning();

    return cartItem;
  });
```

### Auth Middleware Pattern

```typescript
// src/lib/auth/middleware.ts
import { createMiddleware } from "@tanstack/react-start";
import { getHeaders } from "@tanstack/react-start/server";
import { auth } from "./auth";

export const authMiddleware = createMiddleware().server(async ({ next }) => {
  // getHeaders() is from TanStack Start server utilities
  const session = await auth.api.getSession({
    headers: getHeaders(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  return next({ context: { user: session.user } });
});
```

---

## 2. Query Pattern (3 Layers)

### Layer 1: Query Keys

```typescript
// src/lib/queries/query-keys.ts

export const PRODUCT_QUERY_KEYS = {
  all: ["products"] as const,
  lists: () => [...PRODUCT_QUERY_KEYS.all, "list"] as const,
  list: () => [...PRODUCT_QUERY_KEYS.lists()] as const,
  // Handle optional categoryId - use 'all' as fallback
  byCategory: (categoryId?: string) =>
    categoryId
      ? ([...PRODUCT_QUERY_KEYS.lists(), { categoryId }] as const)
      : PRODUCT_QUERY_KEYS.list(),
  details: () => [...PRODUCT_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...PRODUCT_QUERY_KEYS.details(), id] as const,
} as const;

export const CART_QUERY_KEYS = {
  all: ["cart"] as const,
  items: () => [...CART_QUERY_KEYS.all, "items"] as const,
  summary: () => [...CART_QUERY_KEYS.all, "summary"] as const,
} as const;

export const AUTH_QUERY_KEYS = {
  all: ["auth"] as const,
  user: () => [...AUTH_QUERY_KEYS.all, "user"] as const,
  session: () => [...AUTH_QUERY_KEYS.all, "session"] as const,
} as const;
```

### Layer 2: Query Options Factory

```typescript
// src/lib/queries/queries.ts
import { queryOptions, infiniteQueryOptions } from "@tanstack/react-query";
import {
  $getProducts,
  $getProduct,
  $getProductsPaginated,
} from "~/lib/products/functions";
import { PRODUCT_QUERY_KEYS } from "./query-keys";

// Basic query options
export const createProductsQueryOptions = () =>
  queryOptions({
    queryKey: PRODUCT_QUERY_KEYS.list(),
    queryFn: ({ signal }) => $getProducts({ signal }),
    staleTime: 1000 * 60 * 5, // 5 minutes - data considered fresh
    gcTime: 1000 * 60 * 30, // 30 minutes - keep in cache
  });

// Query options with select (transform data)
export const createProductNamesQueryOptions = () =>
  queryOptions({
    queryKey: PRODUCT_QUERY_KEYS.list(),
    queryFn: ({ signal }) => $getProducts({ signal }),
    select: (products) => products.map((p) => ({ id: p.id, name: p.name })),
    staleTime: 1000 * 60 * 5,
  });

// Query options with params
export const createProductQueryOptions = (id: string) =>
  queryOptions({
    queryKey: PRODUCT_QUERY_KEYS.detail(id),
    queryFn: ({ signal }) => $getProduct({ data: { id }, signal }),
    staleTime: 1000 * 60 * 5,
    // Disable query if id is empty
    enabled: id.length > 0,
  });

// Infinite query options for pagination
export const createProductsInfiniteQueryOptions = (categoryId?: string) =>
  infiniteQueryOptions({
    queryKey: PRODUCT_QUERY_KEYS.byCategory(categoryId),
    queryFn: ({ pageParam, signal }) =>
      $getProductsPaginated({
        data: { categoryId, cursor: pageParam },
        signal,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    getPreviousPageParam: (firstPage) => firstPage.prevCursor,
    staleTime: 1000 * 60 * 5,
  });
```

### Layer 3: Custom Hooks

```typescript
// src/lib/queries/queries.ts (continued)
import {
  useQuery,
  useSuspenseQuery,
  useInfiniteQuery,
  useSuspenseInfiniteQuery,
} from "@tanstack/react-query";

// Type inference from server function
export type Product = Awaited<ReturnType<typeof $getProduct>>;
export type Products = Awaited<ReturnType<typeof $getProducts>>;

// Suspense hooks (use with prefetch in loader)
export const useProductsSuspense = () => {
  return useSuspenseQuery(createProductsQueryOptions());
};

export const useProductSuspense = (id: string) => {
  return useSuspenseQuery(createProductQueryOptions(id));
};

// Non-suspense hooks (for conditional/lazy fetching)
export const useProducts = () => {
  return useQuery(createProductsQueryOptions());
};

export const useProduct = (id: string) => {
  return useQuery(createProductQueryOptions(id));
};

// Infinite query hook
export const useProductsInfinite = (categoryId?: string) => {
  return useInfiniteQuery(createProductsInfiniteQueryOptions(categoryId));
};

export const useProductsInfiniteSuspense = (categoryId?: string) => {
  return useSuspenseInfiniteQuery(createProductsInfiniteQueryOptions(categoryId));
};
```

---

## 3. Route Loading Pattern

### Prefetch + Suspense Flow

```typescript
// src/routes/products/index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { createProductsQueryOptions } from "~/lib/queries";
import { ProductList } from "~/components/products/product-list";
import { ProductListSkeleton } from "~/components/products/product-list-skeleton";
import { ProductListError } from "~/components/products/product-list-error";

export const Route = createFileRoute("/products/")({
  // Prefetch on server/navigation (non-blocking)
  loader: ({ context: { queryClient } }) => {
    queryClient.prefetchQuery(createProductsQueryOptions());
  },
  // Skeleton while route is loading
  pendingComponent: () => <ProductListSkeleton />,
  component: ProductsPage,
});

function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Products</h1>
      {/* Error boundary for Suspense errors */}
      <ErrorBoundary
        fallbackRender={({ error, resetErrorBoundary }) => (
          <ProductListError error={error} onRetry={resetErrorBoundary} />
        )}
      >
        <Suspense fallback={<ProductListSkeleton />}>
          <ProductList />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
```

```typescript
// src/components/products/product-list.tsx
import { useProductsSuspense } from "~/lib/queries";

export function ProductList() {
  // Data is already in cache from prefetch
  const { data: products } = useProductsSuspense();

  if (products.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No products available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### ensureQueryData vs prefetchQuery

```typescript
// prefetchQuery - Non-blocking, doesn't throw errors (background fetch)
// Use for: Optimistic prefetching, non-critical data
loader: ({ context: { queryClient } }) => {
  queryClient.prefetchQuery(createProductsQueryOptions());
},

// ensureQueryData - Blocking, throws errors, returns data
// Use for: Critical data that must exist before render
loader: async ({ context: { queryClient } }) => {
  const products = await queryClient.ensureQueryData(
    createProductsQueryOptions()
  );
  return { products };
},
```

---

## 4. Route Protection

### beforeLoad Pattern

```typescript
// src/routes/_auth/route.tsx (pathless layout)
import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { createAuthQueryOptions } from "~/lib/auth/queries";

export const Route = createFileRoute("/_auth")({
  beforeLoad: async ({ context: { queryClient }, location }) => {
    const user = await queryClient.ensureQueryData(createAuthQueryOptions());

    if (!user) {
      // Redirect preserves the original URL for post-login redirect
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }

    // Return data to merge into context for child routes
    return { user };
  },
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="min-h-screen">
      <AuthHeader />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
```

### Guest Route (redirect if logged in)

```typescript
// src/routes/_guest/route.tsx
import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { createAuthQueryOptions } from "~/lib/auth/queries";

export const Route = createFileRoute("/_guest")({
  beforeLoad: async ({ context: { queryClient }, search }) => {
    const user = await queryClient.ensureQueryData(createAuthQueryOptions());

    if (user) {
      // Redirect to original destination or dashboard
      const redirectUrl =
        typeof search.redirect === "string" ? search.redirect : "/dashboard";
      throw redirect({ to: redirectUrl });
    }
  },
  component: () => <Outlet />,
});
```

---

## 5. Route Context

### Sharing Data Between Routes

```typescript
// Parent route - inject context
// src/routes/_auth/route.tsx
export const Route = createFileRoute("/_auth")({
  beforeLoad: async ({ context }) => {
    const user = await fetchUser();
    const permissions = await fetchPermissions(user.id);

    // This object is merged into context
    return { user, permissions };
  },
});

// Child route - access context
// src/routes/_auth/dashboard/index.tsx
export const Route = createFileRoute("/_auth/dashboard/")({
  beforeLoad: async ({ context }) => {
    // Access parent's context
    console.log(context.user); // Available from _auth
    console.log(context.permissions);

    // Can add more to context for deeper children
    return { dashboardData: await fetchDashboard(context.user.id) };
  },
  component: DashboardPage,
});

function DashboardPage() {
  // Access context in component via hook
  const { user, permissions, dashboardData } = Route.useRouteContext();

  return <div>Welcome {user.name}</div>;
}
```

### Type-Safe Root Context

```typescript
// src/router.tsx
import { createRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";

// Define context interface
export interface RouterContext {
  queryClient: QueryClient;
}

// Create router with typed context
export function createAppRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
  });
}

// Register router for type inference
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
```

---

## 6. Mutations Pattern

### Basic Mutation with Cache Invalidation

```typescript
// src/lib/cart/mutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { $addToCart, $removeFromCart } from "~/lib/cart/functions";
import { CART_QUERY_KEYS } from "~/lib/queries/query-keys";
import { toast } from "sonner";

export const useAddToCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { productId: string; quantity: number }) => $addToCart({ data }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEYS.all });
      toast.success("Added to cart");
    },

    onError: (error: Error) => {
      // Safely access error message
      const message = error?.message || "Failed to add to cart";
      toast.error(message);
    },
  });
};

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cartItemId: string) => $removeFromCart({ data: { cartItemId } }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEYS.all });
      toast.success("Removed from cart");
    },

    onError: (error: Error) => {
      toast.error(error?.message || "Failed to remove item");
    },
  });
};
```

### Optimistic Updates

```typescript
// src/lib/cart/mutations.ts
import type { CartItem } from "~/lib/cart/types";

export const useUpdateCartQuantity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { cartItemId: string; quantity: number }) =>
      $updateCartItem({ data }),

    onMutate: async (newData) => {
      // Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEYS.items() });

      // Snapshot previous value for rollback
      const previousCart = queryClient.getQueryData<CartItem[]>(CART_QUERY_KEYS.items());

      // Optimistically update cache
      // IMPORTANT: Handle undefined/null case
      queryClient.setQueryData<CartItem[]>(CART_QUERY_KEYS.items(), (old) => {
        if (!old) return old; // Return undefined if no data yet
        return old.map((item) =>
          item.id === newData.cartItemId ? { ...item, quantity: newData.quantity } : item,
        );
      });

      // Return context for rollback
      return { previousCart };
    },

    onError: (error: Error, _newData, context) => {
      // Rollback on error
      if (context?.previousCart) {
        queryClient.setQueryData(CART_QUERY_KEYS.items(), context.previousCart);
      }
      toast.error(error?.message || "Failed to update quantity");
    },

    onSettled: () => {
      // Always refetch to ensure sync with server
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEYS.items() });
    },
  });
};
```

### Optimistic Update for Adding Items

```typescript
export const useAddToCartOptimistic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { productId: string; quantity: number }) => $addToCart({ data }),

    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEYS.items() });

      const previousCart = queryClient.getQueryData<CartItem[]>(CART_QUERY_KEYS.items());

      // Create optimistic item with temporary ID
      const optimisticItem: CartItem = {
        id: `temp-${Date.now()}`,
        productId: newData.productId,
        quantity: newData.quantity,
        createdAt: new Date(),
        // Mark as optimistic for UI feedback
        _optimistic: true,
      };

      queryClient.setQueryData<CartItem[]>(CART_QUERY_KEYS.items(), (old) =>
        old ? [...old, optimisticItem] : [optimisticItem],
      );

      return { previousCart };
    },

    onError: (error: Error, _newData, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(CART_QUERY_KEYS.items(), context.previousCart);
      }
      toast.error(error?.message || "Failed to add to cart");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEYS.items() });
    },
  });
};
```

---

## 7. Search Params (Type-Safe URL State)

```typescript
// src/routes/products/index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

// Define schema for search params
const productSearchSchema = z.object({
  category: z.string().optional(),
  sort: z.enum(["price-asc", "price-desc", "name", "newest"]).optional().default("newest"),
  page: z.coerce.number().int().positive().optional().default(1),
  search: z.string().optional(),
});

// Infer type from schema
type ProductSearch = z.infer<typeof productSearchSchema>;

export const Route = createFileRoute("/products/")({
  // Validate and parse search params
  validateSearch: productSearchSchema,

  // Re-run loader when search changes
  loaderDeps: ({ search }) => ({ search }),

  // Prefetch with search params
  loader: ({ context: { queryClient }, deps: { search } }) => {
    queryClient.prefetchQuery(createProductsQueryOptions(search));
  },

  component: ProductsPage,
});

function ProductsPage() {
  // Type-safe access to search params
  const { category, sort, page, search } = Route.useSearch();
  const navigate = Route.useNavigate();

  // Update single param (preserves others)
  const handleSortChange = (newSort: ProductSearch["sort"]) => {
    navigate({
      search: (prev) => ({ ...prev, sort: newSort, page: 1 }),
    });
  };

  // Update multiple params
  const handleFilterChange = (filters: Partial<ProductSearch>) => {
    navigate({
      search: (prev) => ({ ...prev, ...filters, page: 1 }),
    });
  };

  // Reset to defaults
  const handleReset = () => {
    navigate({
      search: { sort: "newest", page: 1 },
    });
  };

  // Pagination
  const handlePageChange = (newPage: number) => {
    navigate({
      search: (prev) => ({ ...prev, page: newPage }),
    });
  };

  return (
    <div>
      <ProductFilters
        category={category}
        sort={sort}
        search={search}
        onSortChange={handleSortChange}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
      />
      <ProductList />
      <Pagination
        currentPage={page}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
```

---

## 8. Error & Not Found Handling

### Route-Level Error Component

```typescript
// src/routes/products/$productId.tsx
import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";

export const Route = createFileRoute("/products/$productId")({
  loader: async ({ params, context: { queryClient } }) => {
    try {
      const product = await queryClient.ensureQueryData(
        createProductQueryOptions(params.productId)
      );

      // Explicitly throw notFound if product doesn't exist
      if (!product) {
        throw notFound();
      }

      return { product };
    } catch (error) {
      // Handle specific errors
      if (error instanceof Error && error.message === "Product not found") {
        throw notFound();
      }
      throw error; // Re-throw other errors
    }
  },

  component: ProductPage,

  // Error boundary for this route
  errorComponent: ({ error, reset }) => (
    <div className="flex flex-col items-center justify-center py-12">
      <h2 className="text-destructive text-xl font-semibold">
        Error loading product
      </h2>
      <p className="text-muted-foreground mt-2">
        {error instanceof Error ? error.message : "An unexpected error occurred"}
      </p>
      <div className="mt-4 flex gap-4">
        <Button onClick={reset}>Try Again</Button>
        <Button variant="outline" asChild>
          <Link to="/products">Back to Products</Link>
        </Button>
      </div>
    </div>
  ),

  // 404 component for this route
  notFoundComponent: () => (
    <div className="flex flex-col items-center justify-center py-12">
      <h2 className="text-xl font-semibold">Product not found</h2>
      <p className="text-muted-foreground mt-2">
        The product you're looking for doesn't exist or has been removed.
      </p>
      <Button className="mt-4" asChild>
        <Link to="/products">Browse Products</Link>
      </Button>
    </div>
  ),
});
```

### Root-Level Default Components

```typescript
// src/router.tsx
import { createRouter } from "@tanstack/react-router";
import { DefaultErrorComponent } from "~/components/default-error";
import { DefaultNotFoundComponent } from "~/components/default-not-found";

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultErrorComponent: DefaultErrorComponent,
  defaultNotFoundComponent: DefaultNotFoundComponent,
  // Configure not found mode
  defaultNotFoundOptions: {
    // "fuzzy" (default) - find closest matching route
    // "root" - always use root's notFoundComponent
    mode: "fuzzy",
  },
});
```

```typescript
// src/components/default-error.tsx
import { useRouter } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";

interface DefaultErrorComponentProps {
  error: Error;
  reset: () => void;
}

export function DefaultErrorComponent({ error, reset }: DefaultErrorComponentProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <h1 className="text-2xl font-bold text-destructive">Something went wrong</h1>
      <p className="text-muted-foreground mt-2 max-w-md text-center">
        {error.message || "An unexpected error occurred"}
      </p>
      <div className="mt-6 flex gap-4">
        <Button onClick={reset}>Try Again</Button>
        <Button variant="outline" onClick={() => router.navigate({ to: "/" })}>
          Go Home
        </Button>
      </div>
    </div>
  );
}
```

---

## 9. Deferred Data (Streaming SSR)

### Basic Deferred Pattern

```typescript
// src/routes/_auth/dashboard/index.tsx
import { createFileRoute, defer, Await } from "@tanstack/react-router";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

export const Route = createFileRoute("/_auth/dashboard/")({
  loader: async ({ context }) => {
    // Fast data - await immediately (blocks render)
    const user = await fetchUser();

    // Slow data - defer for streaming (non-blocking)
    // DO NOT await these promises
    const analyticsPromise = fetchAnalytics(user.id);
    const recentOrdersPromise = fetchRecentOrders(user.id);
    const recommendationsPromise = fetchRecommendations(user.id);

    return {
      user,
      // Wrap with defer() for streaming
      analytics: defer(analyticsPromise),
      recentOrders: defer(recentOrdersPromise),
      recommendations: defer(recommendationsPromise),
    };
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { user, analytics, recentOrders, recommendations } =
    Route.useLoaderData();

  return (
    <div className="space-y-8">
      {/* Immediate render - user data is already resolved */}
      <WelcomeHeader user={user} />

      {/* Streamed content with individual loading states */}
      <div className="grid gap-6 md:grid-cols-2">
        <ErrorBoundary fallback={<AnalyticsError />}>
          <Suspense fallback={<AnalyticsSkeleton />}>
            <Await promise={analytics}>
              {(data) => <AnalyticsChart data={data} />}
            </Await>
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary fallback={<OrdersError />}>
          <Suspense fallback={<OrdersSkeleton />}>
            <Await promise={recentOrders}>
              {(orders) => <RecentOrdersList orders={orders} />}
            </Await>
          </Suspense>
        </ErrorBoundary>
      </div>

      <ErrorBoundary fallback={<RecommendationsError />}>
        <Suspense fallback={<RecommendationsSkeleton />}>
          <Await promise={recommendations}>
            {(items) => <RecommendationsGrid items={items} />}
          </Await>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
```

### Performance Considerations

```typescript
// Good: Parallel deferred requests
loader: async () => {
  const user = await fetchUser(); // Fast, await

  // Start all slow requests in parallel
  return {
    user,
    analytics: defer(fetchAnalytics()),
    orders: defer(fetchOrders()),
    // Consider timeout for very slow endpoints
    slowData: defer(
      Promise.race([
        fetchSlowData(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 10000)
        ),
      ])
    ),
  };
},

// Bad: Serial deferred requests
loader: async () => {
  const user = await fetchUser();
  const analytics = await fetchAnalytics(); // Blocks!
  return {
    user,
    analytics,
    orders: defer(fetchOrders()), // Only this streams
  };
},
```

---

## 10. SEO / Head Management

### Static Meta Tags

```typescript
// src/routes/index.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My App - Home" },
      { name: "description", content: "Welcome to My App - your solution for..." },
      { name: "keywords", content: "app, solution, service" },
      // Viewport (usually in root)
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      // Robots
      { name: "robots", content: "index, follow" },
    ],
    links: [{ rel: "canonical", href: "https://myapp.com" }],
  }),
  component: HomePage,
});
```

### Dynamic Meta Tags from Loader

```typescript
// src/routes/products/$productId.tsx
export const Route = createFileRoute("/products/$productId")({
  loader: async ({ params, context: { queryClient } }) => {
    const product = await queryClient.ensureQueryData(
      createProductQueryOptions(params.productId),
    );
    return { product };
  },

  // head receives loaderData with full type safety
  head: ({ loaderData }) => {
    const { product } = loaderData;

    return {
      meta: [
        { title: `${product.name} | My Shop` },
        { name: "description", content: product.description.slice(0, 160) },

        // Open Graph
        { property: "og:type", content: "product" },
        { property: "og:title", content: product.name },
        { property: "og:description", content: product.description },
        { property: "og:image", content: product.image },
        { property: "og:url", content: `https://myshop.com/products/${product.id}` },

        // Twitter Card
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: product.name },
        { name: "twitter:description", content: product.description },
        { name: "twitter:image", content: product.image },

        // Product specific
        { property: "product:price:amount", content: String(product.price) },
        { property: "product:price:currency", content: "USD" },
      ],
      links: [{ rel: "canonical", href: `https://myshop.com/products/${product.id}` }],
    };
  },

  component: ProductPage,
});
```

### Root Layout with HeadContent

```typescript
// src/routes/__root.tsx
import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  Outlet,
} from "@tanstack/react-router";
import type { RouterContext } from "~/router";

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      // Default meta (overridden by child routes)
      { title: "My App" },
      { name: "description", content: "Default description" },
    ],
    links: [
      { rel: "icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),

  component: RootLayout,
});

function RootLayout() {
  return (
    <html lang="en">
      <head>
        {/* Renders all meta tags from matched routes */}
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>
          <Outlet />
          <Toaster />
        </ThemeProvider>
        {/* Scripts for hydration and streaming */}
        <Scripts />
      </body>
    </html>
  );
}
```

---

## 11. TanStack Form

### Field Components (shadcn/ui)

Install field components via shadcn CLI:

```bash
npx shadcn@latest add field
```

This adds `src/components/ui/field.tsx` with `Field`, `FieldGroup`, `FieldLabel`, `FieldError`, `FieldDescription` components.

### Basic Form Pattern with Field Components

```typescript
// src/routes/_auth/checkout/index.tsx
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { useCreateOrder } from "~/lib/orders/queries";

const checkoutSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  street: z.string().min(5, "Street address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().length(2, "State must be 2 characters"),
  postalCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid postal code format"),
  phone: z.string().regex(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, "Invalid phone number"),
  saveAddress: z.boolean(),
});

export function CheckoutForm() {
  const navigate = useNavigate();
  const createOrderMutation = useCreateOrder();

  const form = useForm({
    defaultValues: {
      fullName: "",
      street: "",
      city: "",
      state: "",
      postalCode: "",
      phone: "",
      saveAddress: false,
    },
    validators: {
      onSubmit: checkoutSchema, // Validate only on submit
    },
    onSubmit: async ({ value }) => {
      const result = await createOrderMutation.mutateAsync({
        shippingAddress: {
          fullName: value.fullName,
          street: value.street,
          city: value.city,
          state: value.state.toUpperCase(),
          postalCode: value.postalCode,
          country: "US",
          phone: value.phone,
        },
        saveAddress: value.saveAddress,
      });
      navigate({ to: "/orders/$orderId/confirmation", params: { orderId: result.id } });
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <FieldGroup>
        {/* Text Input Field Pattern */}
        <form.Field
          name="fullName"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>
                  Full Name <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="John Doe"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />

        {/* Grid Layout for Side-by-Side Fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <form.Field
            name="city"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    City <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="New York"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />

          <form.Field
            name="state"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    State <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                    aria-invalid={isInvalid}
                    placeholder="NY"
                    maxLength={2}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
        </div>

        {/* Checkbox Field Pattern */}
        <form.Field
          name="saveAddress"
          children={(field) => (
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.name}
                checked={field.state.value}
                onCheckedChange={(checked) => field.handleChange(checked === true)}
              />
              <FieldLabel htmlFor={field.name} className="cursor-pointer font-normal">
                Save this address for future orders
              </FieldLabel>
            </div>
          )}
        />
      </FieldGroup>

      {/* Form-level error display */}
      {form.state.errors.length > 0 && (
        <div className="bg-destructive/10 text-destructive mt-4 rounded-md p-3">
          <p className="text-sm font-medium">Please fix the errors above before submitting.</p>
        </div>
      )}

      <Button type="submit" disabled={createOrderMutation.isPending} className="mt-6">
        {createOrderMutation.isPending ? "Placing Order..." : "Place Order"}
      </Button>
    </form>
  );
}
```

### Key Patterns Summary

```typescript
// 1. Validation check pattern
const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

// 2. Field structure
<Field data-invalid={isInvalid}>
  <FieldLabel htmlFor={field.name}>Label</FieldLabel>
  <Input
    id={field.name}
    name={field.name}
    value={field.state.value}
    onBlur={field.handleBlur}
    onChange={(e) => field.handleChange(e.target.value)}
    aria-invalid={isInvalid}
  />
  {isInvalid && <FieldError errors={field.state.meta.errors} />}
</Field>

// 3. Form submission
<form onSubmit={(e) => {
  e.preventDefault();
  e.stopPropagation();
  form.handleSubmit();
}}>

// 4. Checkbox with radix-ui pattern
<Checkbox
  checked={field.state.value}
  onCheckedChange={(checked) => field.handleChange(checked === true)}
/>
```

### Array Fields (Dynamic Forms)

```typescript
// src/components/order/order-items-form.tsx
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/components/ui/field";

const orderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
});

const orderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "Add at least one item"),
  shippingAddress: z.string().min(10),
});

export function OrderItemsForm() {
  const form = useForm({
    defaultValues: {
      items: [{ productId: "", quantity: 1, notes: "" }],
      shippingAddress: "",
    },
    validators: { onSubmit: orderSchema },
    onSubmit: async ({ value }) => {
      await createOrder(value);
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      <form.Field name="items" mode="array">
        {(field) => (
          <FieldGroup>
            {field.state.value.map((_, index) => (
              <div key={index} className="flex gap-4 items-end">
                <form.Field
                  name={`items[${index}].productId`}
                  children={(subField) => {
                    const isInvalid = subField.state.meta.isTouched && !subField.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel>Product</FieldLabel>
                        <ProductSelect
                          value={subField.state.value}
                          onChange={subField.handleChange}
                        />
                        {isInvalid && <FieldError errors={subField.state.meta.errors} />}
                      </Field>
                    );
                  }}
                />

                <form.Field
                  name={`items[${index}].quantity`}
                  children={(subField) => {
                    const isInvalid = subField.state.meta.isTouched && !subField.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel>Quantity</FieldLabel>
                        <Input
                          type="number"
                          min={1}
                          value={subField.state.value}
                          onChange={(e) => subField.handleChange(Number(e.target.value))}
                        />
                        {isInvalid && <FieldError errors={subField.state.meta.errors} />}
                      </Field>
                    );
                  }}
                />

                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => field.removeValue(index)}
                  disabled={field.state.value.length === 1}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() => field.pushValue({ productId: "", quantity: 1, notes: "" })}
            >
              Add Item
            </Button>
          </FieldGroup>
        )}
      </form.Field>

      <Button type="submit">Place Order</Button>
    </form>
  );
}
```

### Validation Modes

```typescript
const form = useForm({
  validators: {
    // Choose ONE primary validation strategy:

    // Option 1: Validate on submit only (recommended for most forms)
    onSubmit: schema,

    // Option 2: Validate on blur (good for long forms)
    onBlur: schema,

    // Option 3: Validate on change (use sparingly - can cause performance issues)
    // Consider debouncing for onChange validation
    onChange: schema,
  },
});

// Per-field async validation with debounce
<form.Field
  name="username"
  validators={{
    onChangeAsyncDebounceMs: 500, // Debounce 500ms
    onChangeAsync: async ({ value }) => {
      const exists = await checkUsernameExists(value);
      return exists ? "Username is already taken" : undefined;
    },
  }}
>
  {/* ... */}
</form.Field>
```

---

## 12. Better Auth Configuration

### Server Config

```typescript
// src/lib/auth/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

// Import TanStack Start cookie plugin for SSR compatibility
import { tanstackStartCookies } from "better-auth/tanstack-start";

import { env } from "~/env/server";
import { db } from "~/lib/db";
import * as schema from "~/lib/db/schema";

export const auth = betterAuth({
  // IMPORTANT: Use server-side env variable
  baseURL: env.VITE_BASE_URL,

  // Disable telemetry in production if needed
  telemetry: { enabled: false },

  // Database adapter
  database: drizzleAdapter(db, {
    provider: "pg", // or "mysql", "sqlite"
    schema,
  }),

  // TanStack Start integration
  plugins: [tanstackStartCookies()],

  // Session configuration
  session: {
    // Cookie-based session caching (reduces DB queries)
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
    // Session expiry
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
  },

  // OAuth providers
  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },

  // Email/password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set true in production
  },

  // Advanced options
  advanced: {
    // Generate session token
    generateSessionToken: () => crypto.randomUUID(),
  },
});

// Export auth type for client
export type Auth = typeof auth;
```

### Client Instance

```typescript
// src/lib/auth/auth-client.ts
import { createAuthClient } from "better-auth/client";

const authClient = createAuthClient({
  // Use client-side env variable (prefixed with VITE_)
  baseURL: import.meta.env.VITE_BASE_URL,
});

export default authClient;

// Export typed hooks/methods
export const { signIn, signUp, signOut, useSession, getSession } = authClient;
```

### Auth Server Function

```typescript
// src/lib/auth/functions.ts
import { createServerFn } from "@tanstack/react-start";
import { getHeaders } from "@tanstack/react-start/server";
import { auth } from "./auth";

export const $getUser = createServerFn({ method: "GET" }).handler(async () => {
  const session = await auth.api.getSession({
    headers: getHeaders(),
  });

  return session?.user ?? null;
});
```

### Auth Query Options

```typescript
// src/lib/auth/queries.ts
import { queryOptions } from "@tanstack/react-query";
import { $getUser } from "./functions";
import { AUTH_QUERY_KEYS } from "~/lib/queries/query-keys";

export const createAuthQueryOptions = () =>
  queryOptions({
    queryKey: AUTH_QUERY_KEYS.user(),
    queryFn: () => $getUser(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    // Retry on network errors, but not on auth failures
    retry: (failureCount, error) => {
      if (error?.message === "Unauthorized") return false;
      return failureCount < 3;
    },
  });
```

### API Route Handler

```typescript
// src/routes/api/auth/$.ts
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { auth } from "~/lib/auth/auth";

// Catch-all route for all Better Auth endpoints
export const APIRoute = createAPIFileRoute("/api/auth/$")({
  GET: ({ request }) => auth.handler(request),
  POST: ({ request }) => auth.handler(request),
});
```

---

## 13. SSR & Hydration

### Query Client Setup for SSR

```typescript
// src/router.tsx
import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";

export function createAppRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // SSR: Disable retries during initial render
        retry: false,
        // Prevent refetching immediately after hydration
        staleTime: 1000 * 60, // 1 minute
        // Don't refetch on window focus during SSR
        refetchOnWindowFocus: false,
      },
      dehydrate: {
        // Serialize errors for client
        shouldDehydrateQuery: (query) =>
          query.state.status === "success" || query.state.status === "error",
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    // Dehydrate/hydrate queries automatically
    dehydrate: () => ({
      queryClientState: dehydrate(queryClient),
    }),
    hydrate: (dehydrated) => {
      hydrate(queryClient, dehydrated.queryClientState);
    },
  });

  // Integrate query client with router
  return routerWithQueryClient(router, queryClient);
}
```

### Handling Hydration Mismatches

```typescript
// Avoid hydration mismatches with client-only content
import { useState, useEffect } from "react";

function ClientOnlyComponent() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Skeleton />; // Same as server render
  }

  return <ActualContent />;
}

// Or use suppressHydrationWarning for dynamic content
function DynamicTime() {
  return (
    <time suppressHydrationWarning>
      {new Date().toLocaleString()}
    </time>
  );
}
```

---

## Quick Reference

| Pattern             | When to Use                                      |
| ------------------- | ------------------------------------------------ |
| `prefetchQuery`     | Background fetch, don't block navigation         |
| `ensureQueryData`   | Must have data before render, throws on error    |
| `useSuspenseQuery`  | With prefetch + Suspense boundary                |
| `useQuery`          | Conditional/lazy fetching, manual loading states |
| `useInfiniteQuery`  | Pagination, infinite scroll                      |
| `beforeLoad`        | Auth checks, redirects, context injection        |
| `loader`            | Data prefetching                                 |
| `loaderDeps`        | Re-run loader on search/param change             |
| `validateSearch`    | Type-safe URL search params                      |
| `defer` + `Await`   | Streaming non-critical data                      |
| `head`              | SEO meta tags                                    |
| `errorComponent`    | Route-level error UI                             |
| `notFoundComponent` | 404 UI                                           |
| `pendingComponent`  | Loading UI during navigation                     |

---

## File Structure Convention

```
src/
├── lib/
│   ├── auth/
│   │   ├── auth.ts           # Better Auth server config
│   │   ├── auth-client.ts    # Client instance
│   │   ├── queries.ts        # Auth query options
│   │   ├── functions.ts      # Server functions ($getUser)
│   │   └── middleware.ts     # authMiddleware
│   ├── products/
│   │   ├── functions.ts      # Product server functions
│   │   └── types.ts          # Product types
│   ├── cart/
│   │   ├── functions.ts      # Cart server functions
│   │   ├── mutations.ts      # Cart mutation hooks
│   │   └── types.ts          # Cart types
│   ├── queries/
│   │   ├── query-keys.ts     # All query keys
│   │   └── index.ts          # Query options + hooks exports
│   └── db/
│       ├── index.ts          # Drizzle instance
│       └── schema/           # DB schema
├── routes/
│   ├── __root.tsx            # Root layout with HeadContent
│   ├── index.tsx             # Home page
│   ├── _auth/                # Protected routes (pathless layout)
│   │   ├── route.tsx         # Auth check + redirect
│   │   └── dashboard/
│   │       └── index.tsx
│   ├── _guest/               # Guest-only routes
│   │   ├── route.tsx         # Redirect if logged in
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── products/
│   │   ├── index.tsx         # Product list
│   │   └── $productId.tsx    # Product detail
│   └── api/
│       └── auth/
│           └── $.ts          # Auth API handler (catch-all)
├── components/
│   ├── ui/                   # shadcn components
│   ├── auth/                 # Auth-specific components
│   ├── products/             # Product components
│   └── default-error.tsx     # Default error boundary
├── env/
│   ├── client.ts             # Client env validation
│   └── server.ts             # Server env validation
└── router.tsx                # Router configuration
```

---

## Sources

- [TanStack Start Docs](https://tanstack.com/start/latest)
- [TanStack Router Docs](https://tanstack.com/router/latest)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [TanStack Form Docs](https://tanstack.com/form/latest)
- [Better Auth Docs](https://www.better-auth.com/docs)
- [TkDodo's Blog - Context Inheritance](https://tkdodo.eu/blog/context-inheritance-in-tan-stack-router)
- [TkDodo's Blog - Optimistic Updates](https://tkdodo.eu/blog/concurrent-optimistic-updates-in-react-query)
- [shadcn/ui TanStack Form](https://ui.shadcn.com/docs/forms/tanstack-form)
