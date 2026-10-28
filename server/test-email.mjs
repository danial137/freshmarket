
import "dotenv/config";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
    console.error("RESEND_API_KEY is missing from .env");
    process.exit(1);
}

const resend = new Resend(apiKey);

async function main() {
    const { data, error } = await resend.emails.send({
        from: "FreshMarket <onboarding@resend.dev>",
        to: ["danial79fakhrabadi@gmail.com"],
        subject: "FreshMarket - Email Test",
        html: `
      <h1>Welcome to FreshMarket!</h1>
      <p>Your email service is working.</p>
    `,
    });

    if (error) {
        console.error("Email sending failed:", error);
        process.exitCode = 1;
        return;
    }

    console.log("Email request successful:", data);
}

main().catch((error) => {
    console.error("Unexpected error:", error);
    process.exitCode = 1;
});

