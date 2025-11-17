import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { uuid, newPassword } = await req.json();
    if (!uuid || !newPassword || newPassword.length < 8) {
        return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(uuid, {
        password: newPassword
    });

    if (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Password updated successfully" });
    
    } catch (error: any) {
        console.error("Error updating password:", error);
        return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
    }
}