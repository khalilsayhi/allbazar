"use server"

import {CartItem} from "@/types";
import {convertToPlainObject, formatError, round2} from "@/lib/utils";
import {cookies} from "next/headers";
import {auth} from "@/auth";
import {prisma} from "@/db/prisma";
import {cartItemSchema, insertCartSchema} from "@/lib/validators";
import {revalidatePath} from "next/cache";

const calcPrice = (items: CartItem[]) => {
    const itemsPrice = round2(items.reduce((acc, item) =>
            acc += Number(item.price) * item.qty
        , 0))

    const shippingPrice = round2(itemsPrice > 100 ? 0 : 10);
    const taxPrice = round2(itemsPrice * 0.15);
    const totalPrice = round2(itemsPrice + shippingPrice + taxPrice);

    return {
        itemsPrice: itemsPrice.toFixed(2),
        shippingPrice: shippingPrice.toFixed(2),
        taxPrice: taxPrice.toFixed(2),
        totalPrice: totalPrice.toFixed(2),
    };
}

export async function addItemToCart(data: CartItem) {
    try {
        const sessionCartId = (await cookies()).get("sessionCartId")?.value;
        if (!sessionCartId)
            throw new Error("Cart session not found. Please try again.");

        const session = await auth()
        const userId = session?.user?.id ? session.user.id : undefined;

        const cart = await getMyCart()
        const requestedItem = cartItemSchema.parse(data)
        const product = await prisma.product.findFirst({
            where: {id: requestedItem.productId},
        })
        if (!product) {
            throw new Error("Product not found.");
        }
        if (!cart) {
            const newCart = insertCartSchema.parse({
                userId,
                items: [requestedItem],
                sessionCartId,
                ...calcPrice([requestedItem]),
            })
            await prisma.cart.create({
                data: newCart,
            })
            revalidatePath(`/products/${product.slug}`)
            return {
                success: true, message: `${product.name} added to cart successfully`
            }
        } else {
            const existingItem = cart.items.find(cItem => cItem.productId === requestedItem.productId)
            if (existingItem) {
                if (product.stock < existingItem.qty + 1) {
                    throw new Error("Not enough stock available for this product.");
                }
                cart.items.find(cItem => cItem.productId === requestedItem.productId)!.qty = existingItem.qty + 1;
            } else {
                if (product.stock < 1)
                    throw new Error("Not enough stock available for this product.");
                cart.items.push(requestedItem)
            }
            await prisma.cart.update({
                where: {id: cart.id},
                data: {
                    items: cart.items,
                    ...calcPrice(cart.items),
                },
            })
            revalidatePath(`/products/${product.slug}`)
            return {
                success: true,
                message: `${product.name} ${existingItem ? "updated in" : "added to"} cart`
            }
        }
    } catch (e) {
        return {success: false, message: formatError(e)};
    }
}

export async function getMyCart() {
    const sessionCartId = (await cookies()).get("sessionCartId")?.value;
    if (!sessionCartId)
        throw new Error("Cart session not found. Please try again.");

    const session = await auth()
    const userId = session?.user?.id ? session.user.id : undefined;

    const cart = await prisma.cart.findFirst({
        where: userId ? {userId} : {
            sessionCartId,
        },
    })
    if (!cart) {
        return undefined;
    }
    return convertToPlainObject({
        ...cart,
        items: cart.items as CartItem[],
        itemsPrice: cart.itemsPrice.toString(),
        totalPrice: cart.totalPrice.toString(),
        shippingPrice: cart.totalPrice.toString(),
        taxPrice: cart.totalPrice.toString(),
    })
}

export async function removeItemFromCart(productId: string) {
    try {
        const sessionCartId = (await cookies()).get("sessionCartId")?.value;
        if (!sessionCartId)
            throw new Error("Cart session not found. Please try again.");

        const product = await prisma.product.findFirst({where: {id: productId}});
        if (!product) {
            throw new Error("Product not found.");
        }
        const cart = await getMyCart()
        if (!cart) {
            throw new Error("Cart not found.");
        }
        const exists = cart.items.find(item => item.productId === productId);
        if (!exists) {
            throw new Error("Product not found in cart.");
        }
        if (exists.qty === 1) {
            cart.items = cart.items.filter(item => item.productId !== productId);
        } else {
            cart.items.find(item => item.productId === productId)!.qty -= 1;
        }
        await prisma.cart.update({
            where: {id: cart.id},
            data: {
                items: cart.items,
                ...calcPrice(cart.items),
            },
        })
        revalidatePath(`/products/${product.slug}`)
        return {success: false, message: `${product.name} was removed from cart successfully`};


    } catch (e) {
        return {success: false, message: formatError(e)};
    }
}