"use server";

import {getMyCart} from "@/lib/actions/cart.actions";
import {isRedirectError} from "next/dist/client/components/redirect-error";
import {convertToPlainObject, formatError} from "@/lib/utils";
import {auth} from "@/auth";
import {getUserById} from "@/lib/actions/user.actions";
import {insertOrderSchema} from "@/lib/validators";
import {prisma} from "@/db/prisma";
import {paypal} from "@/lib/paypal";
import {PaymentResult} from "@/types";
import {revalidatePath} from "next/cache";
import {PAGE_SIZE} from "@/lib/constants";


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

// create new paypal order
export async function createPaypalOrder(orderId: string) {
    try {
        const order = await prisma.order.findFirst({
            where: {id: orderId,}
        })
        if (!order) {
            throw new Error("Order not found");
        }
        const paypalOrder = await paypal.createOrder(Number(order.totalPrice))
        await prisma.order.update({
            where: {
                id: orderId,
            }, data: {
                paymentResult: {id: paypalOrder.id, email_address: "", status: "", pricePaid: 0},
            }
        })
        return {
            success: true,
            message: "Item order created successfully",
            data: paypalOrder.id
        }
    } catch (e) {
        return {success: false, message: formatError(e)};
    }
}

// approve payment for paypal order
export async function approvePaypalOrder(orderId: string, data: { orderID: string }) {
    try {
        const order = await prisma.order.findFirst({
            where: {id: orderId,},
        })
        if (!order) {
            throw new Error("Order not found");
        }
        const captureData = await paypal.capturePayment(data.orderID)
        if (!captureData || captureData.id !== (order.paymentResult as PaymentResult).id || captureData.status !== "COMPLETED") {
            throw new Error("Payment capture failed");
        }

        await updateOrderToPaid({
            orderId, paymentResult: {
                id: captureData.id,
                status: captureData.status,
                email_address: captureData.payer.email_address,
                pricePaid: captureData.purchase_units[0]?.payments?.captures[0]?.amount?.value,
            }
        })

        revalidatePath(`/order/${orderId}`);

        return {
            success: true,
            message: "Your order has been paid successfully",
        }
    } catch (e) {
        return {success: false, message: formatError(e)};
    }
}

async function updateOrderToPaid({orderId, paymentResult}: { orderId: string, paymentResult?: PaymentResult }) {
    try {
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,

            },
            include: {
                orderitems: true
            }
        })
        if (!order) {
            throw new Error("Order not found");
        }
        if (order.isPaid) {
            throw new Error("Order is already paid");
        }

        await prisma.$transaction(async (tx) => {
            for (const item of order.orderitems) {
                await tx.product.update({
                    where: {id: item.productId},
                    data: {
                        stock: {
                            decrement: item.qty
                        }
                    }
                });
            }
            await tx.order.update({
                where: {id: orderId},
                data: {
                    isPaid: true,
                    paidAt: new Date(),
                    paymentResult
                }
            })
        })

        const updatedOrder = await prisma.order.findFirst({
            where: {
                id: orderId,
            }, include: {
                orderitems: true,
                user: {
                    select: {name: true, email: true}
                }
            }
        })
        if (!updatedOrder) {
            throw new Error("Failed to update order to paid");
        }
    } catch (e) {
        throw new Error(`Failed to update order to paid: ${formatError(e)}`);
    }
}

// Get users orders
export async function getMyOrders({limit = PAGE_SIZE, page}: { limit?: number, page: number }) {
    try {
        const session = await auth();
        if (!session) {
            throw new Error("User not authenticated");
        }
        const userId = session?.user?.id;
        if (!userId) {
            throw new Error("No user found. Please login to continue.");
        }
        const data = await prisma.order.findMany({
            where: {userId},
            orderBy: {createdAt: "desc"},
            take: limit,
            skip: limit * (page - 1)
        });

        const dataCount = await prisma.order.count({
            where: {
                userId
            }
        })
        console.log(`Total orders: ${dataCount}, Limit: ${limit}, Page: ${page}`);
        return {data, totalPages: Math.ceil(dataCount / limit)}
    } catch (e) {
        throw new Error(formatError(e));
    }
}