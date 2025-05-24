import {getMyCart} from "@/lib/actions/cart.actions";
import {redirect} from "next/navigation";
import {auth} from "@/auth";
import {getUserById} from "@/lib/actions/user.actions";
import CheckoutSteps from "@/components/shared/checkout-steps";
import {Metadata} from "next";
import {ShippingAddress} from "@/types";
import {Card, CardContent} from "@/components/ui/card";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import Image from "next/image";

export const metadata: Metadata = {
    title: "Place Order",
}

const PlaceOrderPage = async () => {

    const cart = await getMyCart();
    if (!cart || cart.items.length === 0) {
        redirect("/cart")
    }
    const session = await auth()
    const userId = session?.user?.id;
    if (!userId) {
        throw new Error("No user found. Please login to continue.");
    }
    const user = await getUserById(userId)

    if (!user.address) {
        redirect("/shipping-address")
    }
    if (!user.paymentMethod) {
        redirect("/payment-method")
    }
    const userAddress = user.address as ShippingAddress;
    return (
        <>
            <CheckoutSteps current={3}/>
            <h1 className="py-4 text-2xl">Place Order</h1>
            <div className="grid md:grid-cols-3  md:gap-5">
                <div className="md:col-span-2 overflow-x-auto space-y-4">
                    <Card>
                        <CardContent className=" gap-4">
                            <h1 className="text-xl pb-4">Shipping Address</h1>
                            <p>{userAddress.fullName}, {userAddress.streetAddress}{" "}
                                {userAddress.postalCode}, {userAddress.country}{" "}
                            </p>
                            <div className="mt-3">
                                <Link href="/shipping-address">
                                    <Button>Edit</Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="gap-4">
                            <h1 className="text-xl pb-4">Payment Method</h1>
                            <p>{user.paymentMethod}</p>
                            <div className="mt-3">
                                <Link href="/payment-method">
                                    <Button>Edit</Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="gap-4">
                            <h1 className="text-xl pb-4">Order Items</h1>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Price</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cart.items.map(item => (
                                        <TableRow key={item.slug}>
                                            <TableCell>
                                                <Link href={`/products/${item.slug}`}
                                                      className="flex items-center no-underline hover:text-gray-600 text-inherit">
                                                    <Image src={item.image} alt={item.name} width={50} height={50}/>
                                                    <span className="px-2">{item.name}</span>
                                                </Link>
                                            </TableCell>
                                            <TableCell>{item.qty}</TableCell>
                                            <TableCell>{item.price}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    )
};

export default PlaceOrderPage;