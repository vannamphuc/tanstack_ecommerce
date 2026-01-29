/// <reference types="vite/client" />
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";

import { TanStackDevtools } from "@tanstack/react-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import { authQueryOptions, type AuthQueryResult } from "~/lib/auth/queries";
import appCss from "~/styles.css?url";

import { SiteFooter } from "~/components/layout/site-footer";
import { SiteHeader } from "~/components/layout/site-header";
import { ThemeProvider } from "~/components/theme-provider";
import { Toaster } from "~/components/ui/sonner";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  user: AuthQueryResult;
}>()({
  beforeLoad: async ({ context }) => {
    // we're using react-query for client-side caching to reduce client-to-server calls, see /src/router.tsx
    // better-auth's cookieCache is also enabled server-side to reduce server-to-db calls, see /src/lib/auth/auth.ts
    // ensure auth data is resolved on server to prevent hydration mismatch
    await context.queryClient.ensureQueryData(authQueryOptions());

    // for protected routes with loader data, see /_auth/route.tsx
  },
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Shop Premium Products Online | My App Store",
      },
      {
        name: "description",
        content:
          "Discover quality products at competitive prices. Browse our curated selection of premium items with fast shipping and secure checkout.",
      },
      // Open Graph
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Shop Premium Products Online | My App Store" },
      {
        property: "og:description",
        content:
          "Discover quality products at competitive prices. Browse our curated selection with fast shipping.",
      },
      { property: "og:image", content: "https://myapp-1-zeta.vercel.app/logo.png" },
      { property: "og:url", content: "https://myapp-1-zeta.vercel.app" },
      // Twitter Card
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Shop Premium Products Online | My App Store" },
      {
        name: "twitter:description",
        content: "Discover quality products at competitive prices.",
      },
      { name: "twitter:image", content: "https://myapp-1-zeta.vercel.app/logo.png" },
      // SEO & Standards
      { name: "robots", content: "index, follow" },
      { name: "language", content: "English" },
      { name: "theme-color", content: "#ffffff" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "canonical", href: "https://myapp-1-zeta.vercel.app" },
      { rel: "icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/logo.png" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "My App Store",
          url: "https://myapp-1-zeta.vercel.app",
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate:
                "https://myapp-1-zeta.vercel.app/products/?search={search_term_string}",
            },
            "query-input": "required name=search_term_string",
          },
        }),
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { readonly children: React.ReactNode }) {
  return (
    // suppress since we're updating the "dark" class in ThemeProvider
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
          <Toaster richColors />
        </ThemeProvider>

        <TanStackDevtools
          plugins={[
            {
              name: "TanStack Query",
              render: <ReactQueryDevtoolsPanel />,
            },
            {
              name: "TanStack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />

        <Scripts />
      </body>
    </html>
  );
}
