
import "dotenv/config";
import { BrevoClient } from "@getbrevo/brevo";

const apiKey = process.env.BREVO_API_KEY;
const senderEmail = process.env.BREVO_SENDER_EMAIL;
const senderName = process.env.BREVO_SENDER_NAME || "FreshMarket";

if (!apiKey) {
    throw new Error("BREVO_API_KEY is missing from environment variables");
}

if (!senderEmail) {
    throw new Error("BREVO_SENDER_EMAIL is missing from environment variables");
}

const brevo = new BrevoClient({
    apiKey,
    timeoutInSeconds: 30,
    maxRetries: 2,
});

export const sendEmail = async ({ to, subject, html }) => {
    if (!to || !subject || !html) {
        throw new Error("Recipient, subject, and HTML are required");
    }

    try {
        const recipients = Array.isArray(to) ? to : [to];

        const result = await brevo.transactionalEmails.sendTransacEmail({
            sender: {
                name: senderName,
                email: senderEmail,
            },
            to: recipients.map((email) => ({ email })),
            subject,
            htmlContent: html,
        });

        console.log("Email sent successfully:", result.messageId);

        return result;
    } catch (error) {
        console.error("Brevo email error:", {
            statusCode: error.statusCode,
            message: error.message,
            body: error.body,
        });

        throw new Error("Failed to send email through Brevo");
    }
};
