import { z } from "zod";
import { phoneZodOptional } from "./phone";

export const contactFormSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  phone: phoneZodOptional,
  company: z.string().optional(),
  subject: z.string().optional(),
  message: z.string()
    .min(10, "Details must be at least 10 characters.")
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
