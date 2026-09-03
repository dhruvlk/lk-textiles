import { NextResponse } from 'next/server';
import { sendAdminEmail, sendUserConfirmationEmail } from '@/lib/email';
import { contactFormSchema } from '@/lib/validations/contact';
import { ZodError } from 'zod';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = contactFormSchema.parse(body);

    // Process both emails concurrently or sequentially
    // Sequential is safer to ensure Admin gets it before confirming to User
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
