'use client';
import {Order} from "@/types";
import React, {useTransition} from 'react';
import {formatCurrency, formatDateTime, formatId} from "@/lib/utils";
import {Card, CardContent} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import Link from "next/link";
import Image from "next/image";
import {PayPalButtons, PayPalScriptProvider, usePayPalScriptReducer} from "@paypal/react-paypal-js";
import {approvePaypalOrder, createPaypalOrder, deliverOrder, updateOrderToPaidCOD} from "@/lib/actions/order.actions";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import StripePayment from "@/app/(root)/order/[id]/stripe-payment";
import {PaymentMethods} from "@/enums/paymentMethods";


const OrderDetailsTable = ({order, paypalClientId, isAdmin, stripeClientSecret}: {
    order: Order,
    paypalClientId: string,
    isAdmin: boolean
    stripeClientSecret: string | null
}) => {
    const {
        id,
        shippingAddress,
        orderItems,
        itemsPrice, shippingPrice, taxPrice, totalPrice, paymentMethod, isPaid, isDelivered, deliveredAt
        , paidAt
    } = order;

    const PrintLoadingState = () => {
        const [{isPending, isRejected}] = usePayPalScriptReducer()
        let status = ""
        if (isPending) {
            status = "Loading PayPal..."
        } else if (isRejected) {
            status = "Error loading PayPal"
        }
        return status
    }

    const handleCreatePaypalOrder = async () => {
        const res = await createPaypalOrder(id)
        if (!res.success) {
            toast.error(res.message)
        }
        return res.data
    }
    const handleApprovePaypalOrder = async (data: { orderID: string }, actions: any) => {
        const res = await approvePaypalOrder(id, data)
        if (!res.success) {
            toast.error(res.message)
            return;
        } else {
            toast.success(res.message)
        }
    }

    const MarkAsPaidButton = () => {
        const [isPending, startTransition] = useTransition()
        const handleMarkAsPaid = async () => {
            startTransition(async () => {
                const res = await updateOrderToPaidCOD(id)
                if (!res.success) {
                    toast.error(res.message)
                    return;
                } else {
                    toast.success(res.message)
                }
            })
        }
        return (<Button type="button" disabled={isPending}
                        onClick={handleMarkAsPaid}>{isPending ? "Processing..." : "Mark As Paid"}</Button>)
    }

    const MarkAsDeliveredButton = () => {
        const [isPending, startTransition] = useTransition()
        const handleDeliver = async () => {
            startTransition(async () => {
                const res = await deliverOrder(id)
                if (!res.success) {
                    toast.error(res.message)
                    return;
                } else {
                    toast.success(res.message)
                }
            })
        }
        return (<Button type="button" disabled={isPending}
                        onClick={handleDeliver}>{isPending ? "Processing..." : "Mark As Delivered"}</Button>)
    }

    return (
        <>
            <h1 className="py-4 text-2xl">Order {formatId(order.id)}</h1>
            <div className="grid md:grid-cols-3 md:gap-5">
                <div className="col-span-2 overflow-x-auto space-y-4">
                    <Card>
                        <CardContent className="p-4 gap-4">
                            <h2 className="text-xl pb-4">Payment Method</h2>
                            <p>{paymentMethod}</p>
                            {isPaid ? (
                                <Badge variant="secondary">Paid at {formatDateTime(paidAt!).dateTime}</Badge>
                            ) : (
                                <Badge variant="destructive">
                                    Not paid
                                </Badge>
                            )}
                        </CardContent>
                    </Card>
                    <Card className="my-2">
                        <CardContent className="p-4 gap-4">
                            <h2 className="text-xl pb-4">Shipping address</h2>
                            <p>{shippingAddress.fullName}</p>
                            <p>
                                {shippingAddress.streetAddress}, {shippingAddress.city} {" "}
                                {shippingAddress.postalCode}, {shippingAddress.country}
                            </p>
                            {isDelivered ? (
                                <Badge variant="secondary">Delivered at {formatDateTime(deliveredAt!).dateTime}</Badge>
                            ) : (
                                <Badge variant="destructive">
                                    Not Delivered
                                </Badge>
                            )}
                        </CardContent>
                    </Card>
                    <Card className="my-2">
                        <CardContent className="p-4 gap-4">
                            <h2 className="text-xl pb-4">Order Items</h2>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Price</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orderItems.map(item => (
                                        <TableRow key={item.slug}>
                                            <TableCell>
                                                <Link href={`/product/${item.slug}`}
                                                      className="flex items-center no-underline hover:text-gray-600 text-inherit">
                                                    <Image src={item.image} alt={item.name} width={50} height={50}/>
                                                    <span className="px-2">{item.name}</span>
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <span className="px-2">{item.qty}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-right">€{item.price}</span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                <div>
                    <Card>
                        <CardContent className="space-y-4 gap-4">
                            <div className="flex justify-between">
                                <div>Items</div>
                                <div>{formatCurrency(itemsPrice)}</div>
                            </div>
                            <div className="flex justify-between">
                                <div>Tax</div>
                                <div>{formatCurrency(taxPrice)}</div>
                            </div>
                            <div className="flex justify-between">
                                <div>Shipping</div>
                                <div>{formatCurrency(shippingPrice)}</div>
                            </div>
                            <div className="flex justify-between">
                                <div>Total</div>
                                <div>{formatCurrency(totalPrice)}</div>
                            </div>
                            {/*paypal payment*/}
                            {!isPaid && paymentMethod === PaymentMethods.PayPal && (
                                <div>
                                    <PayPalScriptProvider options={{clientId: paypalClientId, currency: "EUR"}}>
                                        <PrintLoadingState/>
                                        <PayPalButtons createOrder={handleCreatePaypalOrder}
                                                       onApprove={handleApprovePaypalOrder}/>
                                    </PayPalScriptProvider>
                                </div>
                            )}
                            {!isPaid && paymentMethod === PaymentMethods.Stripe && stripeClientSecret && (
                                <StripePayment priceInCents={Math.round(Number(totalPrice) * 100)} orderId={id}
                                               clientSecret={stripeClientSecret}/>
                            )}
                            {/*cash on delivery*/}
                            {
                                isAdmin && !isPaid && paymentMethod === PaymentMethods.CashOnDelivery && (
                                    <MarkAsPaidButton/>
                                )
                            }
                            {
                                isAdmin && isPaid && !isDelivered && paymentMethod === PaymentMethods.CashOnDelivery && (
                                    <MarkAsDeliveredButton/>
                                )
                            }
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    )
}

export default OrderDetailsTable;