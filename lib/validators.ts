import { z } from "zod";
import { formatNumber } from "./utils";

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
