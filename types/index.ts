import {z} from "zod";
import {
    cartItemSchema,
    insertCartSchema,
    insertOrderItemSchema,
    insertOrderSchema,
    insertProductSchema,
    insertReviewSchema,
    paymentResultSchema,
    shippingAddressSchema
} from "@/lib/validators";
import {PaymentMethods} from "@/enums/paymentMethods";

export type Product = z.infer<typeof insertProductSchema> & {
    id: string;
    rating: string;
    numReviews: number;
    createdAt: Date;
};

export type CartItem = z.infer<typeof cartItemSchema>
export type Cart = z.infer<typeof insertCartSchema>
export type ShippingAddress = z.infer<typeof shippingAddressSchema>
export type OrderItem = z.infer<typeof insertOrderItemSchema>;
export type Order = z.infer<typeof insertOrderSchema> & {
    id: string;
    createdAt: Date;
    isPaid: boolean;
    paidAt: Date | null;
    isDelivered: boolean;
    deliveredAt: Date | null;
    orderItems: OrderItem[];
    user: { name: string; email: string };
};
export type PaymentResult = z.infer<typeof paymentResultSchema>
export type Review = z.infer<typeof insertReviewSchema> & {
    id: string;
    createdAt: Date;
    user?: { name: string };
};

export const PAYMENT_METHODS = process.env.PAYMENT_METHODS ? process.env.PAYMENT_METHODS.split(",") : ["PayPal", "Stripe", "CashOnDelivery"];
export const DEFAULT_PAYMENT_METHOD = PaymentMethods.PayPal