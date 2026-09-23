import { z } from "zod";

/**
 * Extracts pure 10-digit Indian mobile numbers.
 * Strips formatting, letters, leading country code '91' (when >10 digits), and leading zero.
 */
export function cleanPhoneDigits(val?: string | null): string {
  if (!val) return "";
  const str = String(val).trim();

  // If string explicitly starts with '+91' or '+ 91'
  if (str.startsWith("+91") || str.startsWith("+ 91")) {
    const afterCode = str.replace(/^\+\s*91\s*/, "");
    return afterCode.replace(/\D/g, "").slice(0, 10);
  }

  // If string starts with other '+'
  if (str.startsWith("+")) {
    const digitsOnly = str.replace(/\D/g, "");
    if (digitsOnly.startsWith("91") && digitsOnly.length > 10) {
      return digitsOnly.slice(2, 12);
    }
    return digitsOnly.slice(0, 10);
  }

  let digits = str.replace(/\D/g, "");

  // If number starts with 91 and has more than 10 digits (e.g. 919876543210 -> 9876543210)
  if (digits.startsWith("91") && digits.length > 10) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0") && digits.length === 11) {
    // If number starts with 0 and is 11 digits (e.g. 09876543210 -> 9876543210)
    digits = digits.slice(1);
  }

  return digits.slice(0, 10);
}

/**
 * Formats digits or phone string to storage format: '+91XXXXXXXXXX'.
 * Returns null if empty and optional.
 */
export function formatPhoneToStorage(val?: string | null): string | null {
  const digits = cleanPhoneDigits(val);
  if (digits.length === 0) return null;
  return `+91${digits}`;
}

/**
 * Checks whether a given string is a valid Indian mobile number (+91 + 10 digits).
 */
export function isValidIndianMobile(
  val?: string | null,
  options?: { required?: boolean }
): boolean {
  const digits = cleanPhoneDigits(val);
  if (digits.length === 0) {
    return !options?.required;
  }
  return digits.length === 10;
}

/**
 * Zod schema for required 10-digit Indian mobile number.
 */
export const phoneZodRequired = z
  .string()
  .min(1, "Mobile number is required")
  .refine(
    (val) => {
      const digits = cleanPhoneDigits(val);
      return digits.length === 10;
    },
    { message: "Mobile number must be exactly 10 digits" }
  );

/**
 * Zod schema for optional 10-digit Indian mobile number.
 */
export const phoneZodOptional = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      const digits = cleanPhoneDigits(val);
      return digits.length === 0 || digits.length === 10;
    },
    { message: "Mobile number must be exactly 10 digits" }
  );
