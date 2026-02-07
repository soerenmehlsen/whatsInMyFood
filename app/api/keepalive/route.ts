import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function isAuthorized(req: NextRequest): boolean {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
        return true;
    }

    const authHeader = req.headers.get("authorization");
    return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(req: NextRequest) {
    if (!isAuthorized(req)) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        return NextResponse.json(
            {
                success: false,
                error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
            },
            { status: 500 },
        );
    }

    try {
        const supabase = createClient(supabaseUrl, serviceRoleKey);

        // Touch storage daily so the Supabase project is considered active.
        const { error } = await supabase.storage.from("IngredientBucket").list("images", { limit: 1 });

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown keepalive error";
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
