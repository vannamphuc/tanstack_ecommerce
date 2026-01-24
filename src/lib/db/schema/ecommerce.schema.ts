import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth.schema";

/**
 * Category table - Product categories for organization
 */
export const category = pgTable("category", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Product table - Core product information
 */
export const product = pgTable(
  "product",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    categoryId: text("category_id").references(() => category.id, {
      onDelete: "set null",
    }),
    stock: integer("stock").notNull().default(0),
    featured: boolean("featured").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("product_category_idx").on(table.categoryId),
    index("product_featured_idx").on(table.featured),
  ],
);

/**
 * Product Image table - Multiple images per product
 */
export const productImage = pgTable(
  "product_image",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    alt: text("alt").notNull(),
    order: integer("order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("product_image_product_idx").on(table.productId)],
);

/**
 * Cart Item table - Shopping cart items for authenticated users
 */
export const cartItem = pgTable(
  "cart_item",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("cart_item_user_product_idx").on(table.userId, table.productId),
    index("cart_item_user_idx").on(table.userId),
  ],
);

/**
 * Address table - Shipping addresses for users
 */
export const address = pgTable(
  "address",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    street: text("street").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    postalCode: text("postal_code").notNull(),
    country: text("country").notNull().default("US"),
    phone: text("phone").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("address_user_idx").on(table.userId)],
);

/**
 * Order table - Customer orders
 */
export const order = pgTable(
  "order",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    orderNumber: text("order_number").notNull().unique(),
    status: text("status").notNull().default("pending"), // pending, confirmed, shipped, delivered, cancelled
    total: numeric("total", { precision: 10, scale: 2 }).notNull(),
    shippingAddressId: text("shipping_address_id")
      .notNull()
      .references(() => address.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("order_user_idx").on(table.userId),
    index("order_status_idx").on(table.status),
  ],
);

/**
 * Order Item table - Line items in orders
 */
export const orderItem = pgTable(
  "order_item",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => product.id),
    quantity: integer("quantity").notNull(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(), // Snapshot price at time of order
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("order_item_order_idx").on(table.orderId)],
);

/**
 * Relations - Define relationships between tables
 */

// Category relations
export const categoryRelations = relations(category, ({ many }) => ({
  products: many(product),
}));

// Product relations
export const productRelations = relations(product, ({ one, many }) => ({
  category: one(category, {
    fields: [product.categoryId],
    references: [category.id],
  }),
  images: many(productImage),
  cartItems: many(cartItem),
  orderItems: many(orderItem),
}));

// Product Image relations
export const productImageRelations = relations(productImage, ({ one }) => ({
  product: one(product, {
    fields: [productImage.productId],
    references: [product.id],
  }),
}));

// Cart Item relations
export const cartItemRelations = relations(cartItem, ({ one }) => ({
  user: one(user, {
    fields: [cartItem.userId],
    references: [user.id],
  }),
  product: one(product, {
    fields: [cartItem.productId],
    references: [product.id],
  }),
}));

// Address relations
export const addressRelations = relations(address, ({ one, many }) => ({
  user: one(user, {
    fields: [address.userId],
    references: [user.id],
  }),
  orders: many(order),
}));

// Order relations
export const orderRelations = relations(order, ({ one, many }) => ({
  user: one(user, {
    fields: [order.userId],
    references: [user.id],
  }),
  shippingAddress: one(address, {
    fields: [order.shippingAddressId],
    references: [address.id],
  }),
  items: many(orderItem),
}));

// Order Item relations
export const orderItemRelations = relations(orderItem, ({ one }) => ({
  order: one(order, {
    fields: [orderItem.orderId],
    references: [order.id],
  }),
  product: one(product, {
    fields: [orderItem.productId],
    references: [product.id],
  }),
}));
