import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

// Server-side Supabase Admin client (service key)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Generate a secure random password
function generateRandomPassword(length: number) {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

export async function POST(req: Request) {
  try {
    const { staff_name, staff_email, staff_phoneNo, access_level } = await req.json();
    const generatedPassword = generateRandomPassword(8); // generate per request

    // Create user in Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: staff_email,
        password: generatedPassword,
        email_confirm: true,
      });

    if (authError) throw authError;
    if (!authData?.user) throw new Error("User creation failed: missing user data");

    // Insert record into your staff table, linking UUID
    const { error: insertError } = await supabaseAdmin.from("staff").insert([
      {
        uuid: authData.user.id, // link to auth.users.id
        staff_name,
        staff_email,
        staff_phoneNo,
        access_level,
        status: "Active",
      },
    ]);

    if (insertError) throw insertError;

    // Send welcome email with credentials
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER!,
        pass: process.env.GMAIL_PASS!,
      },
    });

    await transporter.sendMail({
    from: `"Growball Cinemax Admin" <${process.env.GMAIL_USER!}>`,
    to: staff_email,
    subject: "Welcome to Cinema Ticketing Management System",
    html: `
        <div style="font-family: Inter, Arial, sans-serif; background-color: #f9fafb; padding: 24px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 6px rgba(0,0,0,0.05);">
            <h2 style="color: #111827;">Welcome, ${staff_name}!</h2>
            <p style="color: #374151; font-size: 16px;">Your staff account has been created successfully.</p>
            <p style="color: #374151; font-size: 16px;">You can now log in using your email:</p>
            <p style="font-weight: bold; color: #111827;">${staff_email}</p>
            <p style="color: #374151; font-size: 16px;">Password: <b>${generatedPassword}</b></p>
            <div style="margin-top: 20px; padding: 12px; background-color: #d1fae5; color: #065f46; border-radius: 8px;">
            Please change your password after your first login.
            </div>
        </div>
        <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 24px;">
            © ${new Date().getFullYear()} Growball Cinemax. All rights reserved.
        </p>
        </div>
    `,
    });


    return NextResponse.json({
      success: true,
      message: "Staff created and linked successfully.",
      staff_uuid: authData.user.id,
    });
  } catch (error: any) {
    console.error("Error creating staff:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
