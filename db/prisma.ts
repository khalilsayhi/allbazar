import {neonConfig} from "@neondatabase/serverless";
import {PrismaNeon} from "@prisma/adapter-neon";
import ws from "ws";
import {PrismaClient} from "../lib/generated/prisma";

// Sets up WebSocket connections for Neon
neonConfig.webSocketConstructor = ws;

// Make sure the connection string is properly formed
const connectionString = process.env.DATABASE_URL;

// Create the pool from the config
/* const pool = new Pool(poolConfig); */

// Create the adapter with the pool
const adapter = new PrismaNeon({connectionString});

// Extend PrismaClient with custom transformers
export const prisma = new PrismaClient({adapter}).$extends({
    result: {
        product: {
            price: {
                compute(product) {
                    return product.price.toString();
                },
            },
            rating: {
                compute(product) {
                    return product.rating.toString();
                },
            },
        },
        cart: {
            itemsPrice: {
                needs: {itemsPrice: true},
                compute(cart) {
                    return cart.itemsPrice.toString();
                },
            }, shippingPrice: {
                needs: {shippingPrice: true},
                compute(cart) {
                    return cart.shippingPrice.toString();
                },
            }, taxPrice: {
                needs: {taxPrice: true},
                compute(cart) {
                    return cart.taxPrice.toString();
                },
            }, totalPrice: {
                needs: {totalPrice: true},
                compute(cart) {
                    return cart.totalPrice.toString();
                },
            }
        },
        order: {
            itemsPrice: {
                needs: {itemsPrice: true},
                compute(order) {
                    return order.itemsPrice.toString();
                },
            }, shippingPrice: {
                needs: {shippingPrice: true},
                compute(order) {
                    return order.shippingPrice.toString();
                },
            }, taxPrice: {
                needs: {taxPrice: true},
                compute(order) {
                    return order.taxPrice.toString();
                },
            }, totalPrice: {
                needs: {totalPrice: true},
                compute(order) {
                    return order.totalPrice.toString();
                },
            }
        },
        orderItem: {
            price: {
                needs: {price: true},
                compute(orderItem) {
                    return orderItem.price.toString();
                },
            },
        },
    },
});
