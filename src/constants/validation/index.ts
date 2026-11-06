export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Supabase's default minimum; a longer rule here would reject passwords the server accepts. */
export const PASSWORD_MIN_LENGTH = 6;

/** Supabase's emailed codes are 6 digits by default and can be set up to 10 in the dashboard. */
export const OTP_PATTERN = /^\d{6,10}$/;
