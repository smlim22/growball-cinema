import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { staff_id, staff_name, staff_email, staff_phoneNo, access_level, uuid} = await req.json();

    //Update staff name and email in Supabase Auth Admin
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.updateUserById( 
        uuid, 
        {
          email: staff_email
        }
      );
    
      if (authError) throw authError;
    if (!authData?.user) throw new Error("Staff email update failed: missing user data");

    const { error: updateError } = await supabaseAdmin
      .from("staff")
      .update({
        staff_name: staff_name,
        staff_email: staff_email,
        staff_phoneNo: staff_phoneNo,
        access_level: Number(access_level)
      })
      .eq("staff_id", Number(staff_id)
    );

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: "Staff details updated successfully",
    });

  } catch (error: any) {
    console.error("Error updating staff:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}