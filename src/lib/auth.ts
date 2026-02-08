import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index.js";
import * as schema from "../db/schema/auth.js";

const secret = process.env.BETTER_AUTH_SECRET!;
const frontendUrl = process.env.BETTER_AUTH_BASE_URL!;

if(!secret) throw new Error("BETTER_AUTH_SECRET is not set in the .env file");
if(!frontendUrl) throw new Error("BETTER_AUTH_BASE_URL is not set in the .env file");

export const auth = betterAuth({
    secret,
    trustedOrigins: [frontendUrl],
    database: drizzleAdapter(db, {
        provider: "pg",
        schema,
    }),
    emailAndPassword: {
        enabled: true,
    },
    user: {
        additionalFields: {
            role: {
                type: "string", required: true, defaultValue: "student", input: true,
            },
            imageCldPubId: {
                type: "string", required: false, input: true,
            },
        }
    },
});