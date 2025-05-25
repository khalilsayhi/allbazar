"use server";

import {prisma} from "@/db/prisma";
import {LATEST_PRODUCTS_LIMIT, PAGE_SIZE} from "../constants";
import {convertToPlainObject, formatError} from "../utils";
import {revalidatePath} from "next/cache";
import {z} from "zod";
import {insertProductSchema, updateProductSchema} from "@/lib/validators";

// Get latest products
export async function getLatestProducts() {
    const data = await prisma.product.findMany({
        take: Number(LATEST_PRODUCTS_LIMIT),
        orderBy: {createdAt: "desc"},
    });
    const formatted = data.map((product) => ({
        ...product,
    }));

    return convertToPlainObject(formatted);
}

// Get single product by slug
export async function getProductBySlug(slug: string) {
    return await prisma.product.findFirst({
        where: {slug},
    });
}

export async function getProductById(id: string) {
    const data = await prisma.product.findFirst({
        where: {id},
    });
    return convertToPlainObject(data)
}

// Get all products
export async function getAllProducts({query, limit = PAGE_SIZE, page, category}: {
    query: string;
    limit?: number;
    page: number;
    category: string;
}) {
    const data = await prisma.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
            createdAt: "desc",
        }
    })
    const dataCount = await prisma.product.count()

    return {
        data,
        totalPages: Math.ceil(dataCount / limit),
    }
}

export async function deleteProduct(id: string) {
    try {
        const productExists = await prisma.product.findFirst({
            where: {id},
        })
        if (!productExists) {
            throw new Error("Product not found");
        }

        await prisma.product.delete({
            where: {id},
        })
        revalidatePath('/admin/products');
        return {
            success: true,
            message: "Product deleted successfully"
        }

    } catch (e) {
        return {
            success: false,
            message: formatError(e)
        }
    }
}

export async function createProduct(data: z.infer<typeof insertProductSchema>) {
    try {
        const product = insertProductSchema.parse(data)
        await prisma.product.create({
            data: product
        })
        revalidatePath("/admin/products");

        return {
            success: true,
            message: "Product created successfully"
        }
    } catch (e) {
        return {
            success: false,
            message: formatError(e)
        }
    }
}

export async function updateProduct(data: z.infer<typeof updateProductSchema>) {
    try {
        const product = updateProductSchema.parse(data)
        const productExists = await prisma.product.findFirst({
            where: {id: product.id},
        })
        if (!productExists) {
            throw new Error("Product not found");
        }
        await prisma.product.update({
            where: {id: product.id},
            data: product
        })
        revalidatePath("/admin/products");

        return {
            success: true,
            message: "Product updated successfully"
        }
    } catch (e) {
        return {
            success: false,
            message: formatError(e)
        }
    }
}