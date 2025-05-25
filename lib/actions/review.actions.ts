"use server";

import {prisma} from "@/db/prisma";
import {z} from "zod";
import {insertReviewSchema} from "@/lib/validators";
import {formatError} from "@/lib/utils";
import {auth} from "@/auth";
import {revalidatePath} from "next/cache";

export async function createOrUpdateReview(data: z.infer<typeof insertReviewSchema>) {
    try {
        const session = await auth()
        if (!session) {
            throw new Error("User not authenticated");
        }
        const userId = session?.user?.id;
        if (!userId) {
            throw new Error("No user found. Please login to continue.");
        }
        const review = insertReviewSchema.parse({...data, userId})
        const reviewedProduct = await prisma.product.findFirst({
            where: {
                id: review.productId,
            }
        })
        if (!reviewedProduct) {
            throw new Error("Product not found");
        }
        const reviewExists = await prisma.review.findFirst({
            where: {
                productId: review.productId,
                userId: review.userId
            }
        })
        await prisma.$transaction(async (tx) => {
            if (reviewExists) {
                await tx.review.update({
                    where: {
                        id: reviewExists.id
                    }, data: {
                        title: review.title,
                        description: review.description,
                        rating: review.rating
                    }
                })
            } else {
                await tx.review.create({
                    data: {
                        title: review.title,
                        description: review.description,
                        rating: review.rating,
                        productId: review.productId,
                        userId: review.userId
                    }
                })
            }
            const averageRating = await tx.review.aggregate({
                _avg: {
                    rating: true
                },
                where: {
                    productId: review.productId
                }
            })

            const numberOfReviews = await tx.review.count({
                where: {
                    productId: review.productId
                }
            })
            await tx.product.update({
                where: {
                    id: review.productId
                },
                data: {
                    rating: averageRating._avg.rating || 0,
                    numReviews: numberOfReviews
                }
            })
        })
        revalidatePath(`/product/${reviewedProduct.slug}`);
        return {success: true, message: "Review created/updated successfully"};
    } catch (e) {
        return {success: false, message: formatError(e)};
    }
}

export async function getReviews({productId}: { productId: string }) {
    const data = await prisma.review.findMany({
        where: {
            productId: productId
        }, include: {
            user: {
                select: {
                    name: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    return {data};
}

export async function getReviewByProductId({productId}: { productId: string }) {
    const session = await auth()
    if (!session) {
        throw new Error("User not authenticated");
    }
    const userId = session?.user?.id;
    if (!userId) {
        throw new Error("No user found. Please login to continue.");
    }
    return await prisma.review.findFirst({
        where: {
            productId: productId,
            userId
        }, include: {
            user: {
                select: {
                    name: true
                }
            }
        }
    });
}