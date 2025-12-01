// app/api/support/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service role for server-side
);

const OWNER_EMAIL =
  process.env.SUPPORT_OWNER_EMAIL || "you@example.com";

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Support <no-reply@yourdomain.com>";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, message } = body as {
      name?: string;
      email?: string;
      message: string;
    };

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const ip =
      req.headers.get("x-forwarded-for") ||
      req.ip ||
      "unknown";

    // You can plug IP → geo lookup here if you want.
    const { data: conversation, error: convError } =
      await supabase
        .from("support_conversations")
        .insert({
          name: name?.trim() || null,
          email: email?.trim() || null,
          ip,
          last_message: message.trim(),
        })
        .select()
        .single();

    if (convError || !conversation) {
      console.error(convError);
      return NextResponse.json(
        { error: "Failed to create conversation" },
        { status: 500 }
      );
    }

    const { error: msgError } = await supabase
      .from("support_messages")
      .insert({
        conversation_id: conversation.id,
        from_role: "user",
        message: message.trim(),
      });

    if (msgError) {
      console.error(msgError);
    }

    // Optional: send notification email to you
    if (OWNER_EMAIL && resend) {
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: OWNER_EMAIL,
          subject: "New support chat message (Global Edge)",
          html: `
            <p>You have a new support chat conversation.</p>
            <p><strong>Name:</strong> ${name || "Unknown"}</p>
            <p><strong>Email:</strong> ${email || "Unknown"}</p>
            <p><strong>Message:</strong> ${message}</p>
            <p><strong>Conversation ID:</strong> ${conversation.id}</p>
          `,
        });
      } catch (e) {
        console.error("Resend error", e);
      }
    }

    return NextResponse.json({ conversationId: conversation.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}
