import nodemailer from 'nodemailer';

// Create a transporter using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});


export interface ContactFormData {
  fullName: string;
  email: string;
  phone?: string;
  company?: string;
  subject?: string;
  message: string;
}

export const sendAdminEmail = async (data: ContactFormData) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
      <div style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
        
        <!-- Header -->
        <div style="background-color: #001142; padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 2px;">Lk Textiles</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 24px; font-size: 20px; font-weight: 600; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px;">
            New Inquiry from ${data.fullName}
          </h2>
          
          <p style="margin-bottom: 24px; color: #475569; font-size: 15px; line-height: 1.6;">
            A new contact form submission has been received. Here are the details:
          </p>
          
          <table style="width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 24px;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #64748b; width: 100px;">Name</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 500;">${data.fullName}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #64748b;">Email</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;"><a href="mailto:${data.email}" style="color: #2563eb; text-decoration: none;">${data.email}</a></td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #64748b;">Phone</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${data.phone || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #64748b;">Company</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${data.company || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #64748b;">Subject</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 500;">${data.subject || 'N/A'}</td>
            </tr>
          </table>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px;">
            <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 14px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Message</h3>
            <div style="color: #1e293b; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${data.message}</div>
          </div>
          
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 13px; color: #64748b; margin: 0;">
            Submitted on: <strong>${timestamp}</strong>
          </p>
        </div>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"${data.fullName}" <${process.env.SMTP_USER}>`,
    to: adminEmail,
    subject: `New Inquiry from ${data.fullName}${data.company ? ` (${data.company})` : ''}`,
    text: `New Contact Form Submission from ${data.fullName} (${data.email}).\nPhone: ${data.phone || 'N/A'}\nCompany: ${data.company || 'N/A'}\nSubject: ${data.subject || 'New Inquiry'}\nMessage: ${data.message}`,
    html: htmlContent,
    replyTo: data.email,
  });
};

export const sendUserConfirmationEmail = async (data: ContactFormData) => {
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
      <div style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
        
        <!-- Header -->
        <div style="background-color: #001142; padding: 35px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 2px;">Lk Textiles</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 20px; font-size: 22px; font-weight: 600;">
            Thank you, ${data.fullName}!
          </h2>
          
          <p style="margin-bottom: 20px; color: #475569; font-size: 16px; line-height: 1.6;">
            We have successfully received your inquiry. Our sales team is currently reviewing your details and will get back to you within 24 hours.
          </p>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 20px; margin: 30px 0; border-radius: 0 6px 6px 0;">
            <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 14px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Your Inquiry Summary</h3>
            
            <div style="margin-bottom: 12px;">
              <strong style="color: #0f172a; display: block; font-size: 13px; text-transform: uppercase; margin-bottom: 4px;">Subject</strong>
              <div style="color: #334155; font-size: 15px;">${data.subject || 'General Inquiry'}</div>
            </div>
            
            <div>
              <strong style="color: #0f172a; display: block; font-size: 13px; text-transform: uppercase; margin-bottom: 4px;">Message</strong>
              <div style="color: #334155; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${data.message}</div>
            </div>
          </div>
          
          <p style="margin-bottom: 0; color: #475569; font-size: 15px; line-height: 1.6;">
            If you need immediate assistance, please reply directly to this email or call us at <strong>+91 98765 43210</strong>.
          </p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
            <p style="margin: 0; color: #0f172a; font-size: 16px;">Best Regards,</p>
            <p style="margin: 4px 0 0 0; color: #0f172a; font-weight: 600; font-size: 16px;">The Lk Textiles Team</p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 13px; color: #64748b; margin: 0;">
            This is an automated confirmation for your submission on ${timestamp}.
          </p>
        </div>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Lk Textiles" <${process.env.SMTP_USER}>`,
    to: data.email,
    subject: `Thank you for your inquiry, ${data.fullName} - Lk Textiles`,
    text: `Dear ${data.fullName},\n\nWe have successfully received your inquiry regarding "${data.subject || 'your project'}". Our sales team is currently reviewing your details and will get back to you within 24 hours.\n\nBest Regards,\nThe Lk Textiles Team`,
    html: htmlContent,
    replyTo: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
  });
};
