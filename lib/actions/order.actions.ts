"use server";

import {getMyCart} from "@/lib/actions/cart.actions";
import {isRedirectError} from "next/dist/client/components/redirect-error";
import {convertToPlainObject, formatError} from "@/lib/utils";
import {auth} from "@/auth";
import {getUserById} from "@/lib/actions/user.actions";
import {insertOrderSchema} from "@/lib/validators";
import {prisma} from "@/db/prisma";


// Create order
export async function createOrder() {
    try {
        const session = await auth()
        if (!session) {
            throw new Error("User not authenticated");
        }
        const cart = await getMyCart()
        const userId = session?.user?.id;
        if (!userId) {
            throw new Error("No user found. Please login to continue.");
        }
        const user = await getUserById(userId)
        if (!cart || cart.items.length === 0) {
            return {
                success: false,
                message: "Cart is empty. Please add items to your cart before placing an order.",
                redirectTo: "/cart"
            };
        }
        if (!user.address) {
            return {
                success: false,
                message: "Please provide a shipping address before placing an order.",
                redirectTo: "/shipping-address"
            };
        }
        if (!user.paymentMethod) {
            return {
                success: false,
                message: "Please select a payment method before placing an order.",
                redirectTo: "/payment-method"
            };
        }

        const order = insertOrderSchema.parse(
            {
                userId: user.id,
                paymentMethod: user.paymentMethod,
                shippingAddress: user.address,
                itemsPrice: cart.itemsPrice,
                totalPrice: cart.totalPrice,
                shippingPrice: cart.shippingPrice,
                taxPrice: cart.taxPrice,
            }
        );
        const insertedOrderId = await prisma.$transaction(async (tx) => {
            const insertedOrder = await tx.order.create({
                data: order,
            });
            for (const item of cart.items) {
                await tx.orderItem.create({
                    data: {
                        ...item,
                        price: item.price,
                        orderId: insertedOrder.id,
                    }

                })
            }
            await tx.cart.update({
                where: {
                    id: cart.id,
                }, data: {
                    items: [],
                    itemsPrice: 0,
                    totalPrice: 0,
                    shippingPrice: 0,
                    taxPrice: 0,
                }
            });
            return insertedOrder.id
        })
        if (!insertedOrderId) {
            throw new Error("Failed to create order");
        }
        return {success: false, message: "Order placed successfully", redirectTo: `/order/${insertedOrderId}`};

    } catch (e) {
        if (isRedirectError(e)) throw e
        return {success: false, message: formatError(e)};
    }
}

// get order by id
export async function getOrderById(orderId: string) {
    const order = await prisma.order.findFirst({
        where: {id: orderId,},
        include: {
            orderitems: true,
            user: {
                select: {name: true, email: true}
            }
        },
    });
    if (!order) {
        throw new Error("Order not found");
    }
    return convertToPlainObject(order);
}