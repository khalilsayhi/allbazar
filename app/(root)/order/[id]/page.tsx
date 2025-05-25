import {Metadata} from 'next';
import {getOrderById} from '@/lib/actions/order.actions';
import {notFound, redirect} from 'next/navigation';
import {auth} from '@/auth';
import OrderDetailsTable from "@/app/(root)/order/[id]/order-details-table";
import {OrderItem, ShippingAddress} from "@/types";
import Stripe from "stripe";
import {PaymentMethods} from "@/enums/paymentMethods";

export const metadata: Metadata = {
    title: 'Order Details',
};

const OrderDetailsPage = async (props: {
    params: Promise<{
        id: string;
    }>;
}) => {
    const {id} = await props.params;

    const order = await getOrderById(id);
    if (!order) notFound();

    const session = await auth();

    if (order.userId !== session?.user?.id && session?.user?.role !== 'admin') {
        return redirect('/unauthorized');
    }

    let clientSecret = null
    if (order.paymentMethod === PaymentMethods.Stripe && !order.isPaid) {
        const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY as string)
        const paymentIntent = await stripeInstance.paymentIntents.create({
            amount: Math.round(Number(order.totalPrice) * 100),
            currency: 'eur',
            metadata: {
                orderId: order.id,
            }
        });
        clientSecret = paymentIntent.client_secret;
    }
    return (
        <OrderDetailsTable
            isAdmin={session?.user?.role === 'admin'}
            paypalClientId={process.env.PAYPAL_CLIENT_ID || 'sb'}
            stripeClientSecret={clientSecret}
            order={{
                ...order,
                orderItems: order.orderitems as OrderItem[],
                shippingAddress: order.shippingAddress as ShippingAddress,
            }}/>
    );
};

export default OrderDetailsPage;