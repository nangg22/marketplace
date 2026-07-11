import { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { products } from "@/lib/schema";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const allProducts = await db.select({ id: products.id, updatedAt: products.updatedAt }).from(products);

  const productUrls = allProducts.map((p) => ({
    url: `https://marketplace-1vxs.vercel.app/products/${p.id}`,
    lastModified: p.updatedAt,
  }));

  return [
    { url: "https://marketplace-1vxs.vercel.app", lastModified: new Date() },
    ...productUrls,
  ];
}
