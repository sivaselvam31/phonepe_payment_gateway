const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
app.use(cors())
app.use(express.json());

const PORT = 8000;

// PhonePe API constants
const MERCHANT_BASE_URL = "https://api.phonepe.com/apis/pg/checkout/v2/pay";
const MERCHANT_AUTH_URL = "https://api.phonepe.com/apis/identity-manager/v1/oauth/token";

const client_id = "SU2504231251338267218682";
const client_version = "1";
const client_secret = "051435ce-330f-4a5c-a7c0-868d223dd99d";
const grant_type = "client_credentials";
app.post('/create-order', async (req, res) => {
    const { name, mobileNumber, amount } = req.body;
    const orderId = uuidv4();

    // Validate required fields
    if (!amount || isNaN(amount)) {
        return res.status(400).json({
            success: false,
            message: 'Amount is required and must be a number'
        });
    }

    try {
        // Step 1: Get OAuth token
        const authRes = await axios.post(MERCHANT_AUTH_URL,
            new URLSearchParams({
                client_id,
                client_secret,
                grant_type,
                client_version
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Accept: 'application/json'
                }
            }
        );

        const accessToken = authRes.data.access_token;

        // Step 2: Prepare payment payload
        const payload = {
            merchantOrderId: "newtxn" + Date.now(),
            amount: 100, // 1.00 INR (in paise)
            expireAfter: 1200,
            metaInfo: {
                udf1: "test1",
                udf2: "new param2",
                udf3: "test3",
                udf4: "dummy value 4",
                udf5: "addition infor ref1"
            },
            paymentFlow: {
                type: "PG_CHECKOUT",
                message: "Payment message used for collect requests",
                merchantUrls: {
                    redirectUrl: "https://www.ddtechods.com/course.html"
                }
            }
        };
        // Step 3: Initiate payment
        const response = await axios.post(
            MERCHANT_BASE_URL,
            payload, // Stringify the payload directly
            {
                headers: {
                    Authorization: `O-Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                }
            }
        );

        const redirectUrl = response.data.redirectUrl;
        console.log("Redirect URL:", redirectUrl);
        res.status(200).json({
            success: true,
            message: 'Payment link created',
            url: redirectUrl,
            orderId
        });

    } catch (error) {
        console.error("Error in payment process:", error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to create payment',
            error: error.response?.data || error.message
        });
    }
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
