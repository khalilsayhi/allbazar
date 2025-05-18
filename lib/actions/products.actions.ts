"use server";

import { prisma } from "@/db/prisma";
import { LATEST_PRODUCTS_LIMIT } from "../constants";
import { convertToPlainObject } from "../utils";

// Get latest products
export async function getLatestProducts() {
  const data = await prisma.product.findMany({
    take: Number(LATEST_PRODUCTS_LIMIT),
    orderBy: { createdAt: "desc" },
  });
  const formatted = data.map((product) => ({
    ...product,
  }));

  return convertToPlainObject(formatted);
}

// Get single product by slug
export async function getProductBySlug(slug: string) {
  return await prisma.product.findFirst({
    where: { slug },
  });
}
