import "dotenv/config";
import { db } from "./index";
import { category, product, productImage } from "./schema";
import { nanoid } from "nanoid";

// Helper to create slug from name
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Clear existing data
    console.log("Clearing existing data...");
    await db.delete(productImage);
    await db.delete(product);
    await db.delete(category);

    // Create categories
    console.log("Creating categories...");
    const categories = await db
      .insert(category)
      .values([
        {
          id: nanoid(),
          name: "Electronics",
          slug: "electronics",
          description: "Latest gadgets and electronic devices",
          image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop",
        },
        {
          id: nanoid(),
          name: "Clothing",
          slug: "clothing",
          description: "Fashion and apparel for all occasions",
          image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop",
        },
        {
          id: nanoid(),
          name: "Home & Garden",
          slug: "home-garden",
          description: "Everything for your home and outdoor spaces",
          image: "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=400&h=300&fit=crop",
        },
        {
          id: nanoid(),
          name: "Books",
          slug: "books",
          description: "Fiction, non-fiction, and educational books",
          image: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=300&fit=crop",
        },
      ])
      .returning();

    console.log(`Created ${categories.length} categories`);

    // Create products for each category
    const productsData = [
      // Electronics
      {
        categoryName: "Electronics",
        products: [
          {
            name: "Wireless Noise-Cancelling Headphones",
            description:
              "Premium over-ear headphones with active noise cancellation, 30-hour battery life, and superior sound quality. Perfect for music lovers and frequent travelers.",
            price: "299.99",
            stock: 25,
            featured: true,
            images: [
              "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop",
              "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&h=800&fit=crop",
            ],
          },
          {
            name: "4K Smart TV 55-inch",
            description:
              "Ultra HD 4K smart television with HDR support, built-in streaming apps, and voice control. Transform your living room into a home theater.",
            price: "799.99",
            stock: 8,
            featured: false,
            images: ["https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&h=800&fit=crop"],
          },
          {
            name: "Mechanical Gaming Keyboard",
            description:
              "RGB backlit mechanical keyboard with customizable keys and macro support. Tactile switches for the ultimate gaming experience.",
            price: "149.99",
            stock: 42,
            featured: true,
            images: ["https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&h=800&fit=crop"],
          },
          {
            name: "Smartphone Pro Max",
            description:
              "Latest flagship smartphone with 5G connectivity, triple camera system, and all-day battery life. Stay connected in style.",
            price: "1099.99",
            stock: 15,
            featured: false,
            images: [
              "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop",
              "https://images.unsplash.com/photo-1592286927505-b32e1d7d0f6f?w=800&h=800&fit=crop",
            ],
          },
        ],
      },
      // Clothing
      {
        categoryName: "Clothing",
        products: [
          {
            name: "Classic Denim Jacket",
            description:
              "Timeless denim jacket with a comfortable fit. Made from premium cotton for durability and style. A wardrobe essential for any season.",
            price: "89.99",
            stock: 35,
            featured: true,
            images: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=800&fit=crop"],
          },
          {
            name: "Premium Cotton T-Shirt Pack",
            description:
              "Set of 3 premium cotton t-shirts in classic colors. Soft, breathable fabric that holds its shape wash after wash.",
            price: "39.99",
            stock: 120,
            featured: false,
            images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop"],
          },
          {
            name: "Wool Blend Winter Coat",
            description:
              "Elegant wool blend coat with a slim fit design. Perfect for cold weather, combining warmth with sophisticated style.",
            price: "249.99",
            stock: 12,
            featured: false,
            images: ["https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=800&fit=crop"],
          },
          {
            name: "Athletic Running Shoes",
            description:
              "Lightweight running shoes with responsive cushioning and breathable mesh upper. Designed for performance and comfort on every run.",
            price: "129.99",
            stock: 45,
            featured: true,
            images: [
              "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop",
              "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=800&h=800&fit=crop",
            ],
          },
        ],
      },
      // Home & Garden
      {
        categoryName: "Home & Garden",
        products: [
          {
            name: "Modern Floor Lamp",
            description:
              "Sleek contemporary floor lamp with adjustable head and dimmer function. Perfect ambient lighting for any room in your home.",
            price: "149.99",
            stock: 18,
            featured: false,
            images: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&h=800&fit=crop"],
          },
          {
            name: "Ceramic Planter Set",
            description:
              "Set of 3 handcrafted ceramic planters in various sizes. Drainage holes included. Add a touch of nature to your living space.",
            price: "59.99",
            stock: 62,
            featured: true,
            images: ["https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&h=800&fit=crop"],
          },
          {
            name: "Memory Foam Pillow Set",
            description:
              "Set of 2 contoured memory foam pillows with cooling gel layer. Hypoallergenic and machine washable covers. Sleep better tonight.",
            price: "79.99",
            stock: 33,
            featured: false,
            images: ["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=800&fit=crop"],
          },
          {
            name: "Stainless Steel Cookware Set",
            description:
              "Professional-grade 10-piece stainless steel cookware set. Compatible with all cooktops including induction. Built to last a lifetime.",
            price: "399.99",
            stock: 9,
            featured: true,
            images: ["https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&h=800&fit=crop"],
          },
        ],
      },
      // Books
      {
        categoryName: "Books",
        products: [
          {
            name: "The Art of Programming",
            description:
              "Comprehensive guide to modern programming practices and principles. From fundamentals to advanced techniques. Perfect for developers at all levels.",
            price: "49.99",
            stock: 88,
            featured: false,
            images: ["https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&h=800&fit=crop"],
          },
          {
            name: "Mindfulness and Meditation",
            description:
              "Practical guide to incorporating mindfulness and meditation into your daily life. Reduce stress and improve mental clarity.",
            price: "24.99",
            stock: 105,
            featured: false,
            images: ["https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=800&fit=crop"],
          },
          {
            name: "World History Encyclopedia",
            description:
              "Comprehensive illustrated encyclopedia covering human history from ancient civilizations to the modern era. Over 1000 pages of knowledge.",
            price: "79.99",
            stock: 15,
            featured: true,
            images: ["https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=800&h=800&fit=crop"],
          },
          {
            name: "Classic Fiction Collection",
            description:
              "Beautifully bound collection of 5 timeless classic novels. Perfect for any book lover's library or as a thoughtful gift.",
            price: "89.99",
            stock: 22,
            featured: false,
            images: ["https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&h=800&fit=crop"],
          },
        ],
      },
    ];

    let totalProducts = 0;
    let totalImages = 0;

    for (const categoryData of productsData) {
      const cat = categories.find((c) => c.name === categoryData.categoryName);
      if (!cat) continue;

      console.log(`Creating products for ${cat.name}...`);

      for (const productData of categoryData.products) {
        const productId = nanoid();

        // Insert product
        await db.insert(product).values({
          id: productId,
          name: productData.name,
          slug: createSlug(productData.name),
          description: productData.description,
          price: productData.price,
          categoryId: cat.id,
          stock: productData.stock,
          featured: productData.featured,
        });

        // Insert product images
        const images = productData.images.map((url, index) => ({
          id: nanoid(),
          productId,
          url,
          alt: `${productData.name} - Image ${index + 1}`,
          order: index,
        }));

        await db.insert(productImage).values(images);

        totalProducts++;
        totalImages += images.length;
      }
    }

    console.log(`\n✅ Seeding complete!`);
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Products: ${totalProducts}`);
    console.log(`   Images: ${totalImages}`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run the seed function
seed()
  .then(() => {
    console.log("\n🎉 Database seeded successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Seeding failed:", error);
    process.exit(1);
  });
