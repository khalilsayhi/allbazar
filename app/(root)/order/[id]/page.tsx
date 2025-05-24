import {Metadata} from 'next';
import {getOrderById} from '@/lib/actions/order.actions';
import {notFound, redirect} from 'next/navigation';
import {auth} from '@/auth';
import OrderDetailsTable from "@/app/(root)/order/[id]/order-details-table";
import {OrderItem, ShippingAddress} from "@/types";

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


    return (
        <OrderDetailsTable
            order={{
                ...order,
                orderItems: order.orderitems as OrderItem[],
                shippingAddress: order.shippingAddress as ShippingAddress,
            }}/>
    );
};

export default OrderDetailsPage;