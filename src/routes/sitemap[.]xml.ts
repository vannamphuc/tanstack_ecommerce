import { createFileRoute } from "@tanstack/react-router";
import { db } from "~/lib/db";

/**
 * Dynamic sitemap.xml route for SEO
 * Crawls all products and generates XML sitemap
 * Accessed at /sitemap.xml
 */
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          // Fetch all products for sitemap
          const products = await db.query.product.findMany({
            columns: {
              id: true,
              updatedAt: true,
            },
          });

          // Generate XML sitemap
          const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static pages -->
  <url>
    <loc>https://myapp-1-zeta.vercel.app/</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://myapp-1-zeta.vercel.app/products</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- Dynamic product pages -->
  ${products
    .map(
      (prod) => `
  <url>
    <loc>https://myapp-1-zeta.vercel.app/products/${prod.id}</loc>
    <lastmod>${prod.updatedAt ? prod.updatedAt.toISOString().split("T")[0] : new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`,
    )
    .join("")}
</urlset>`;

          return new Response(sitemap, {
            headers: {
              "Content-Type": "application/xml",
              "Cache-Control": "public, max-age=86400", // Cache for 24 hours
            },
          });
        } catch (error) {
          console.error("Error generating sitemap:", error);
          return new Response("Error generating sitemap", {
            status: 500,
          });
        }
      },
    },
  },
});
