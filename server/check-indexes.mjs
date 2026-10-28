
import "dotenv/config";
import mongoose from "mongoose";
import User from "./models/User.js";

try {
    await mongoose.connect(process.env.MONGODB_URI);

    const indexes = await User.collection.indexes();

    console.log("User collection indexes:");

    console.log(
        JSON.stringify(
            indexes.map(({ name, key, unique, sparse, partialFilterExpression }) => ({
                name,
                key,
                unique,
                sparse,
                partialFilterExpression,
            })),
            null,
            2
        )
    );
} catch (error) {
    console.error("Index check failed:", error.message);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
