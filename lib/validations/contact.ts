import { z } from "zod";

export const contactFormSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string()
    .refine(
      (val) => {
        const trimmed = val.replace(/\s+/g, "");
        return trimmed === "+91" || trimmed === "" || /^\+91\d{10}$/.test(trimmed);
      },
      { message: "Please enter exactly 10 digits." }
    )
    .transform(val => {
      const trimmed = val.replace(/\s+/g, "");
      if (trimmed === "+91" || trimmed === "") return "";
      return trimmed;
    })
    .optional(),
  company: z.string().optional(),
  subject: z.string().optional(),
  message: z.string()
    .min(10, "Product requirements must be at least 10 characters.")
    .superRefine((val, ctx) => {
      const wordCount = val.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Product Requirements cannot exceed 100 words.",
        });
      }
    })
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
