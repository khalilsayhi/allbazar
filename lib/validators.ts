import {z} from "zod";
import {formatNumber} from "./utils";
import {PAYMENT_METHODS} from "@/types";

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

// Schema for updating products
export const updateProductSchema = insertProductSchema.extend({
    id: z.string().min(1, "Product ID is required"),
})

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

// Schema for shipping address
export const shippingAddressSchema = z.object({
    fullName: z.string().min(3, "Nom doit étre composé de 3 caractères"),
    streetAddress: z.string().min(3, "Adresse doit étre composé de 3 caractères"),
    city: z.string().min(5, "Ville doit étre composé de 5 caractères"),
    postalCode: z.string().min(5, "Code postale doit étre composé de 5 caractères"),
    country: z.string().min(3, "Pays doit étre composé de 3 caractères"),
    lat: z.number().optional(),
    lon: z.number().optional()
})

// Schema for payment methods
export const paymentMethodSchema = z.object({
    type: z.string().min(1, "Methode de payement est requise"),
}).refine((data) => PAYMENT_METHODS.includes(data.type))

// Schema for inserting order
export const insertOrderSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    itemsPrice: currency,
    totalPrice: currency,
    shippingPrice: currency,
    taxPrice: currency,
    paymentMethod: z.string().refine((data) => PAYMENT_METHODS.includes(data), "Methode de payement non valide"),
    shippingAddress: shippingAddressSchema,
})

// Schema for inserting order item
export const insertOrderItemSchema = z.object({
    productId: z.string().min(1, "Product ID is required"),
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required"),
    image: z.string().min(1, "Image is required"),
    price: currency,
    qty: z.number(),
})

// Schema for payment result
export const paymentResultSchema = z.object({
    id: z.string(),
    status: z.string(),
    pricePaid: z.string(),
    email_address: z.string(),
})

// Schema for updating user profile
export const updateUserProfileSchema = z.object({
    name: z.string().min(3, "Nom doit étre composé de 3 caractères"),
    email: z.string().email("Adresse email invalide"),
})

// Schema for updating user
export const updateUserSchema = updateUserProfileSchema.extend({
    id: z.string().min(1, "ID is required"),
    role: z.string().min(1, "Role is required"),
})

// Schema for inserting review
export const insertReviewSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(3, 'Description must be at least 3 characters'),
    productId: z.string().min(1, 'Product is required'),
    userId: z.string().min(1, 'User is required'),
    rating: z.coerce
    .number()
    .int()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
});