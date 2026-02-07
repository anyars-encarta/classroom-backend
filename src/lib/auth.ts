import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "../db/schema/auth";

const secret = process.env.BETTER_AUTH_SECRET!;

if(!secret) throw new Error("BETTER_AUTH_SECRET is not set in the .env file");

export const auth = betterAuth({
    secret,
    trustedOrigins: [process.env.FRONTEND_URL!],
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
                type: "string", required: true, defaultValue: "student", input: false,
            },
            imageCldPubId: {
                type: "string", required: false, input: true,
            },
        }
    },
});