'use client';
import React from 'react';
import {Cart, CartItem} from "@/types";
import {Button} from "@/components/ui/button";
import {addItemToCart, removeItemFromCart} from "@/lib/actions/cart.actions";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {Loader, Minus, Plus} from "lucide-react";

const AddToCart = ({item, cart}: { item: CartItem, cart?: Cart }) => {
    const router = useRouter();
    const [isPending, startTransition] = React.useTransition();


    const handleAddToCart = async () => {
        startTransition(async () => {
            const res = await addItemToCart(item)
            if (!res.success) {
                toast.error(res.message)
                return
            }
            toast.success(res.message, {
                action: {
                    label: 'Go to Cart',
                    onClick: () => router.push('/cart'),
                },
            })
        })
    }
    const handleRemoveFromCart = async () => {
        startTransition(async () => {
            const res = await removeItemFromCart(item.productId)
            if (!res.success) {
                toast.error(res.message)
            }
            toast.success(res.message)
            return
        })
    }

    const existingItem = cart && cart.items.find(cItem => cItem.productId === item.productId);

    return existingItem ? (<div>
        <Button type="button" onClick={handleRemoveFromCart}>{isPending ? (
            <Loader className="w-4 h-4 animate-spin"/>) : (<Minus
            className="h-4 w-4"/>)}</Button>
        <span className="px-2">
        {existingItem.qty}
    </span>
        <Button type="button" onClick={handleAddToCart}>{isPending ? (
            <Loader className="w-4 h-4 animate-spin"/>) : (<Plus
            className="h-4 w-4"/>)}</Button>
    </div>) : (
        <Button className="w-full" type="button" onClick={handleAddToCart}>{isPending ? (
            <Loader className="w-4 h-4 animate-spin"/>) : (<Plus
            className="h-4 w-4"/>)}Add To Cart</Button>)
}


export default AddToCart;