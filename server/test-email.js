
import "dotenv/config";
import { sendEmail } from "./utils/emailService.js";

try {
    await sendEmail({
        to: "danial79fakhrabadi@gmail.com",
        subject: "FreshMarket Email Test",
        html: `
      <h1>Hello from FreshMarket!</h1>
      <p>Brevo email service is working.</p>
    `,
    });

    console.log("Email test completed.");
} catch (error) {
    console.error("Email test failed:", error.message);
}
