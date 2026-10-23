import { NextResponse } from 'next/server';
import { sendAdminEmail, sendUserConfirmationEmail } from '@/lib/email';
import { contactFormSchema } from '@/lib/validations/contact';
import { createAdminClient } from '@/lib/supabase/admin';
import { ZodError } from 'zod';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

// Public endpoint that sends email: throttle to limit spam / SMTP abuse.
const CONTACT_LIMIT = 5;
const CONTACT_WINDOW_MS = 10 * 60 * 1000;

export async function POST(req: Request) {
  const rate = checkRateLimit(`contact:${getClientIp(req.headers)}`, CONTACT_LIMIT, CONTACT_WINDOW_MS);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many messages. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
    );
  }

  try {
    const body = await req.json();
    const validatedData = contactFormSchema.parse(body);

    // Save inquiry to Supabase database
    try {
      const adminClient = createAdminClient();
      const { error: dbError } = await adminClient.from('inquiries').insert({
        full_name: validatedData.fullName,
        email: validatedData.email,
        phone: validatedData.phone || null,
        company: validatedData.company || null,
        subject: validatedData.subject || null,
        message: validatedData.message,
        status: 'new',
      });

      if (dbError) {
        console.error('Failed to save inquiry to database:', dbError);
      }
    } catch (dbErr) {
      console.error('Database error saving inquiry:', dbErr);
    }

    // Process both emails sequentially to ensure Admin gets it before confirming to User
    const emailData = {
      ...validatedData,
      phone: validatedData.phone || undefined,
    };
    await sendAdminEmail(emailData);
    await sendUserConfirmationEmail(emailData);

    return NextResponse.json(
      { success: true, message: 'Message sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending contact emails:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send message. Please try again later.' },
      { status: 500 }
    );
  }
}
