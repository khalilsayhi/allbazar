const baseUrl = process.env.PAYPAL_API_URL || "https://api-m.sandbox.paypal.com";

export const paypal = {
    createOrder: async function (price: number) {
        const accessToken = await generateAccessToken();
        const url = `${baseUrl}/v2/checkout/orders`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            }, body: JSON.stringify({
                intent: "CAPTURE",
                purchase_units: [{
                    amount: {
                        currency_code: "EUR",
                        value: price,
                    },
                }],
            })
        })
        return handleResponse(response)
    },
    capturePayment: async function (orderId: string) {
        const accessToken = await generateAccessToken();
        const url = `${baseUrl}/v2/checkout/orders/${orderId}/capture`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            }
        })
        return handleResponse(response)
    }
}

async function generateAccessToken() {
    const {PAYPAL_CLIENT_ID, PAYPAL_APP_SECRET} = process.env;


    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_ID) {
        throw new Error("PayPal client ID or secret is not set.");
    }
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_APP_SECRET}`).toString("base64");

    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${auth}`,
        },
        body: new URLSearchParams({grant_type: "client_credentials"}),
    });

    const data = await handleResponse(response)
    return data.access_token;
}

const handleResponse = async (response: Response) => {
    if (response.ok) {
        return response.json()
    } else {
        const errorMessage = await response.text()
        throw new Error(errorMessage);
    }
}

export {
    generateAccessToken
}