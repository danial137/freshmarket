
import { Resend } from "resend";
import "dotenv/config";
const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
    throw new Error("RESEND_API_KEY is missing from environment variables");
}

const resend = new Resend(apiKey);

export async function sendEmail({ to, subject, html }) {
    if (!to || !subject || !html) {
        throw new Error("Email recipient, subject, and html are required");
    }

    const { data, error } = await resend.emails.send({
        from: "FreshMarket <onboarding@resend.dev>",
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
    });

    if (error) {
        console.error("Resend email error:", error);
        throw new Error("Failed to send email");
    }

    return data;
}
