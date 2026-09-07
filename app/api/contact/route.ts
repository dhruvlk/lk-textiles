import { NextResponse } from 'next/server';
import { sendAdminEmail, sendUserConfirmationEmail } from '@/lib/email';
import { contactFormSchema } from '@/lib/validations/contact';
import { createAdminClient } from '@/lib/supabase/admin';
import { ZodError } from 'zod';

export async function POST(req: Request) {
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
    await sendAdminEmail(validatedData);
    await sendUserConfirmationEmail(validatedData);

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
