import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateRandomPassword(length : number) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(req: Request) {
  try {
    const { staff_email, staff_name, uuid } = await req.json();

    if (!staff_email || !uuid) {
      return NextResponse.json(
        { success: false, error: "Missing parameters" },
        { status: 400 }
      );
    }

    // Generate new random password
    const newPassword = generateRandomPassword(8);

    // Update Supabase Auth user password
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(uuid, {
      password: newPassword,
    });
    if (authError) throw authError;

    // Configure Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    // Build the styled email body
    const htmlBody = `
      <div style="font-family: Inter, Arial, sans-serif; background-color: #f9fafb; padding: 24px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 6px rgba(0,0,0,0.05);">
          <h2 style="color: #111827;">Password Reset for ${staff_name}</h2>
          <p style="color: #374151; font-size: 16px;">Your password has been successfully reset by the administrator.</p>
          <p style="color: #374151; font-size: 16px;">You can now log in using your email:</p>
          <p style="font-weight: bold; color: #111827;">${staff_email}</p>
          <p style="color: #374151; font-size: 16px;">New Password: <b>${newPassword}</b></p>
          <div style="margin-top: 20px; padding: 12px; background-color: #d1fae5; color: #065f46; border-radius: 8px;">
            Please change your password after your next login for security.
          </div>
        </div>
        <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 24px;">
          © ${new Date().getFullYear()} Growball Cinemax. All rights reserved.
        </p>
      </div>
    `;

    // Send the email
    await transporter.sendMail({
      from: `"Growball Cinemax Admin" <${process.env.GMAIL_USER!}>`,
      to: staff_email,
      subject: "Your Password Has Been Reset",
      html: htmlBody,
    });

    return NextResponse.json({
      success: true,
      message: "Password reset and email sent successfully.",
    });
  } catch (error: any) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}