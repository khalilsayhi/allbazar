import {z} from "zod";
import {formatNumber} from "./utils";

const currency = z
.string()
.refine(
    (val) => /^\d+(\.\d{2})?$/.test(formatNumber(Number(val))),
    "Price must have exactly two decimal places",
);

// Schema for inserting products
export const insertProductSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 character long"),
    slug: z.string().min(3, "Slug must be at least 3 character long"),
    category: z.string().min(3, "Category must be at least 3 character long"),
    brand: z.string().min(3, "Brand must be at least 3 character long"),
    description: z
    .string()
    .min(3, "Description must be at least 3 character long"),
    stock: z.coerce.number(),
    images: z.array(z.string()).min(1, "At least one image is required"),
    isFeatured: z.boolean(),
    banner: z.string().nullable(),
    price: currency,
});

// Schema for signing users in
export const signInFormSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

// Schema for signing up a user
export const signUpFormSchema = z
.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z
    .string()
    .min(6, "Confirm password must be at least 6 characters"),
})
.refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});


// Cart schema
export const cartItemSchema = z.object({
    productId: z.string().min(1, "product is required"),
    name: z.string().min(1, "name is required"),
    slug: z.string().min(1, "slug is required"),
    qty: z.number().int().nonnegative("qty must be a positive number"),
    image: z.string().min(1, "image is required"),
    price: currency
})

export const insertCartSchema = z.object({
    items: z.array(cartItemSchema),
    itemsPrice: currency,
    totalPrice: currency,
    shippingPrice: currency,
    taxPrice: currency,
    sessionCartId: z.string().min(1, "session cart id is required"),
    userId: z.string().optional().nullable(),
})
