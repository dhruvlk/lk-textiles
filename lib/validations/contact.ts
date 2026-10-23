import { z } from "zod";
import { phoneZodOptional } from "./phone";

export const contactFormSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters.").max(100, "Full name is too long."),
  email: z.string().trim().max(254, "Email is too long.").email("Please enter a valid email address."),
  phone: phoneZodOptional,
  company: z.string().trim().max(150, "Company name is too long.").optional(),
  subject: z.string().trim().max(200, "Subject is too long.").optional(),
  message: z.string()
    .min(10, "Details must be at least 10 characters.")
    .max(2000, "Details are too long.")
    .superRefine((val, ctx) => {
      const wordCount = val.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Details cannot exceed 100 words.",
        });
      }
    })
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
