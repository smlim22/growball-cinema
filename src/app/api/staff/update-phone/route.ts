import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const { staff_id, staff_phoneNo } = await req.json();

        const { error: updateError } = await supabaseAdmin
            .from("staff")
            .update({
                staff_phoneNo: staff_phoneNo
            })
            .eq("staff_id", Number(staff_id)
        );
        
        if (updateError) throw updateError;

        return NextResponse.json({
            success: true,
            message: "Staff phone number updated successfully",
        });

    } catch (error: any) {
        console.error("Error updating staff phone number:", error);
        return NextResponse.json({
            success: false,
            message: error.message || "An error occurred while updating the phone number",
        }, { status: 500 });
    }
}