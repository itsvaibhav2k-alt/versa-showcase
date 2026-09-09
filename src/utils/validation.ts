const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?1?\d{10,15}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return PHONE_REGEX.test(digits);
}

/**
 * Returns true if the string is a valid ISO date (YYYY-MM-DD).
 */
export function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) return false;
  const d = new Date(date.trim());
  return !isNaN(d.getTime());
}

/**
 * Returns true if the string parses to a valid date/time.
 */
export function isValidDateTime(value: string): boolean {
  const d = new Date(value.trim());
  return !isNaN(d.getTime());
}
