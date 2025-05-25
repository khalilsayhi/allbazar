"use server";

import {prisma} from "@/db/prisma";
import {LATEST_PRODUCTS_LIMIT, PAGE_SIZE} from "../constants";
import {convertToPlainObject, formatError} from "../utils";
import {revalidatePath} from "next/cache";
import {z} from "zod";
import {insertProductSchema, updateProductSchema} from "@/lib/validators";
import {Prisma} from "@/lib/generated/prisma";

// Get latest products
export async function getLatestProducts() {
    const data = await prisma.product.findMany({
        take: LATEST_PRODUCTS_LIMIT,
        orderBy: {createdAt: 'desc'},
    });

    return convertToPlainObject(data);
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
// Get all products
export async function getAllProducts(
    {
        query,
        limit = PAGE_SIZE,
        page,
        category,
        price,
        rating,
        sort,
    }: {
        query: string;
        limit?: number;
        page: number;
        category?: string;
        price?: string;
        rating?: string;
        sort?: string;
    }) {
    // Query filter
    const queryFilter: Prisma.ProductWhereInput =
        query && query !== 'all'
            ? {
                name: {
                    contains: query,
                    mode: 'insensitive',
                } as Prisma.StringFilter,
            }
            : {};

    // Category filter
    const categoryFilter = category && category !== 'all' ? {category} : {};

    // Price filter
    const priceFilter: Prisma.ProductWhereInput =
        price && price !== 'all'
            ? {
                price: {
                    gte: Number(price.split('-')[0]),
                    lte: Number(price.split('-')[1]),
                },
            }
            : {};

    // Rating filter
    const ratingFilter =
        rating && rating !== 'all'
            ? {
                rating: {
                    gte: Number(rating),
                },
            }
            : {};

    const data = await prisma.product.findMany({
        where: {
            ...queryFilter,
            ...categoryFilter,
            ...priceFilter,
            ...ratingFilter,
        },
        orderBy:
            sort === 'lowest'
                ? {price: 'asc'}
                : sort === 'highest'
                    ? {price: 'desc'}
                    : sort === 'rating'
                        ? {rating: 'desc'}
                        : {createdAt: 'desc'},
        skip: (page - 1) * limit,
        take: limit,
    });

    const dataCount = await prisma.product.count();

    return {
        data,
        totalPages: Math.ceil(dataCount / limit),
    };
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

export async function getAllCategories() {
    return await prisma.product.groupBy({
        by: ['category'],
        _count: true,
    })
}

export async function getFeaturedProducts() {
    const data = await prisma.product.findMany({
        where: {isFeatured: true},
        orderBy: {createdAt: 'desc'},
        take: 4,
    });

    return convertToPlainObject(data);
}