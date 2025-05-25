export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "All Bazar";
export const APP_DESCRIPTION =
    process.env.NEXT_PUBLIC_APP_DESCRIPTION || "lorem ipsum dolor sit amet";
export const SERVER_URL =
    process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";

export const LATEST_PRODUCTS_LIMIT = Number(process.env.LATEST_PRODUCTS_LIMIT) || 4;

export const signInDefaultValues = {
    email: "",
    password: "",
};
export const signUpDefaultValues = {
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
};

export const shippingAddressDefaultValues = {
    fullName: "John Doe",
    streetAddress: "27 avenue des Champs-Élysées",
    city: "Paris",
    postalCode: "75008",
    country: "France",

}
export const PAGE_SIZE = Number(process.env.NEXT_PUBLIC_PAGE_SIZE) || 12

export const productDefaultValues = {
    name: '',
    slug: '',
    category: '',
    images: [],
    brand: '',
    description: '',
    price: '0',
    stock: 0,
    rating: '0',
    numReviews: '0',
    isFeatured: false,
    banner: null,
};

export const USER_ROLES = process.env.USER_ROLES ? process.env.USER_ROLES.split(",") : ["admin", "user"]