import NextAuth, {NextAuthConfig} from "next-auth";
import {PrismaAdapter} from "@auth/prisma-adapter";
import {prisma} from "./db/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import {compareSync} from "bcrypt-ts-edge";
import {NextResponse} from "next/server";
import {cookies} from "next/headers";

export const config = {
    pages: {
        signIn: "/signin",
        error: "/signin",
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    adapter: PrismaAdapter(prisma),
    providers: [
        CredentialsProvider({
            credentials: {
                email: {type: "text"},
                password: {type: "password"},
            },
            async authorize(credentials) {
                if (credentials == null) {
                    return null;
                }
                const user = await prisma.user.findFirst({
                    where: {
                        email: credentials.email as string,
                    },
                });
                if (user && user.password) {
                    const isMatch = compareSync(
                        credentials.password as string,
                        user.password,
                    );
                    if (isMatch) {
                        return {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            role: user.role,
                        };
                    }
                }
                return null;
            },
        }),
    ],
    callbacks: {
        async redirect({url, baseUrl}: { url: string; baseUrl: string }) {
            const isRelativeUrl = url.startsWith("/");
            if (isRelativeUrl) {
                return `${baseUrl}${url}`;
            }

            const isSameOriginUrl = new URL(url).origin === baseUrl;
            const alreadyRedirected = url.includes("callbackUrl=");
            if (isSameOriginUrl && alreadyRedirected) {
                return decodeURIComponent(
                    url.split("callbackUrl=")[1],
                );
            }

            if (isSameOriginUrl) {
                return url;
            }

            return baseUrl;
        },
        async session({session, user, trigger, token}: any) {
            session.user.id = token.sub;
            session.user.role = token.role;
            session.user.name = token.name;

            if (trigger === "update") {
                session.user.name = user.name;
            }
            return session;
        },
        async jwt({token, user, trigger, session}: any) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                if (user.name === "NO_NAME") {
                    token.name = user.email!.split("@")[0];
                    await prisma.user.update({
                        where: {id: user.id},
                        data: {name: token.name},
                    });
                }
                if (trigger === "signIn" || trigger === "signUp") {
                    const cookiesObject = await cookies()
                    const sessionCartId = cookiesObject.get("sessionCartId")?.value
                    if (sessionCartId) {
                        const sessionCart = await prisma.cart.findFirst({
                            where: {
                                sessionCartId
                            }
                        })
                        if (sessionCart) {
                            await prisma.cart.deleteMany({
                                where: {
                                    userId: user.id
                                }
                            })
                            await prisma.cart.update({
                                where: {
                                    id: sessionCart.id
                                }, data: {
                                    userId: user.id
                                }
                            })
                        }
                    }
                }
            }

            if (session?.user.name && trigger === "update") {
                token.name === session.user.name
            }
            return token;
        },
        authorized({request, auth}: any) {
            const protectedPaths = [
                /\/shipping-address/,
                /\/payment-method/,
                /\/place-order/,
                /\/profile/,
                /\/user\/(.*)/,
                /\/order\/(.*)/,
                /\/admin/,
            ];
            const {pathname} = request.nextUrl;
            if (!auth && protectedPaths.some((p) => p.test(pathname))) return NextResponse.redirect(new URL('/sign-in', request.url));

            if (!request.cookies.get("sessionCartId")) {
                const sessionCartId = crypto.randomUUID();
                const newRequestHeaders = new Headers(request.headers);

                const res = NextResponse.next(
                    {
                        request: {
                            headers: newRequestHeaders,
                        },
                    }
                )
                res.cookies.set("sessionCartId", sessionCartId)
                return res;
            } else {
                return true
            }
        }
    },
} satisfies NextAuthConfig;

export const {handlers, auth, signIn, signOut} = NextAuth(config);
