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
import {Prisma} from "@/lib/generated/prisma";


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


type SalesDataType = {
    month: string;
    totalSales: number;
}[]

// Get sales data and order summary
export async function getOrderSummary() {
    // Get counts for each resource
    const ordersCount = await prisma.order.count();
    const productsCount = await prisma.product.count();
    const usersCount = await prisma.user.count();

    // Calculate the total sales
    const totalSales = await prisma.order.aggregate({
        _sum: {totalPrice: true},
    });

    // Get monthly sales
    const salesDataRaw = await prisma.$queryRaw<Array<{
        month: string;
        totalSales: Prisma.Decimal
    }>>`SELECT to_char("createdAt", 'MM/YY') as "month", sum("totalPrice") as "totalSales"
        FROM "Order"
        GROUP BY to_char("createdAt", 'MM/YY')`;

    const salesData: SalesDataType = salesDataRaw.map((entry) => ({
        month: entry.month,
        totalSales: Number(entry.totalSales),
    }));

    // Get latest sales
    const latestSales = await prisma.order.findMany({
        orderBy: {createdAt: 'desc'},
        include: {
            user: {select: {name: true}},
        },
        take: 6,
    });

    return {
        ordersCount,
        productsCount,
        usersCount,
        totalSales,
        latestSales,
        salesData,
    };
}

export async function getAllOrders({limit = PAGE_SIZE, page, query}: { limit?: number, page: number, query: string }) {
    const queryFilter: Prisma.OrderWhereInput =
        query && query !== 'all'
            ? {
                user: {
                    name: {
                        contains: query,
                        mode: 'insensitive',
                    } as Prisma.StringFilter,
                },
            }
            : {};
    const data = await prisma.order.findMany({
        where: {...queryFilter},
        orderBy: {createdAt: "desc"},
        take: limit,
        skip: limit * (page - 1),
        include: {
            user: {
                select: {name: true}
            },
        }
    })
    const dataCount = await prisma.order.count();
    return {
        data: data,
        totalPages: Math.ceil(dataCount / limit)
    };
}

export async function deleteOrder(orderId: string) {
    try {
        await prisma.order.delete({
            where: {id: orderId},
        });
        revalidatePath("/admin/orders");
        return {success: true, message: "Order deleted successfully"};
    } catch (e) {
        return {success: false, message: formatError(e)};
    }
}

export async function updateOrderToPaidCOD(orderId: string) {
    try {
        await updateOrderToPaid({orderId})
        revalidatePath("/order/${orderId}");
        return {success: true, message: "Order Marked as paid"};
    } catch (e) {
        return {success: false, message: formatError(e)};
    }
}

export async function deliverOrder(orderId: string) {
    try {
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
            },
        });

        if (!order) throw new Error('Order not found');
        if (!order.isPaid) throw new Error('Order is not paid');

        await prisma.order.update({
            where: {id: orderId},
            data: {
                isDelivered: true,
                deliveredAt: new Date(),
            },
        });

        revalidatePath(`/order/${orderId}`);

        return {
            success: true,
            message: 'Order has been marked delivered',
        };
    } catch (error) {
        return {success: false, message: formatError(error)};
    }
}