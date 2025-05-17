import { insertProductSchema } from "@/lib/validators";
import { z } from "zod";

export type Product = Omit<z.infer<typeof insertProductSchema>, "price"> & {
  id: string;
  rating: number;
  crratedAt: Date;
  price: number;
};
