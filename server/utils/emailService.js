
export const sendEmail = async ({ to, subject, html }) => {
    if (!to || !subject || !html) {
        throw new Error("Recipient, subject, and HTML are required");
    }

    // Development mode: do not send real emails
    if (process.env.NODE_ENV === "development") {
        console.log("\n========== DEVELOPMENT EMAIL ==========");
        console.log("To:", to);
        console.log("Subject:", subject);
        console.log("Email content:", html);
        console.log("=======================================\n");

        return {
            messageId: "development-email",
        };
    }

    try {
        const recipients = Array.isArray(to) ? to : [to];

        const result = await brevo.transactionalEmails.sendTransacEmail({
            sender: { name: senderName, email: senderEmail },
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
