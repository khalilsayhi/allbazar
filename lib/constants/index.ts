export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "All Bazar";
export const APP_DESCRIPTION =
    process.env.NEXT_PUBLIC_APP_DESCRIPTION || "lorem ipsum dolor sit amet";
export const SERVER_URL =
    process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";

export const LATEST_PRODUCTS_LIMIT = process.env.LATEST_PRODUCTS_LIMIT || 4;

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