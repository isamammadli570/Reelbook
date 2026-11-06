/** Lowercase letters, digits and underscores, 3 to 20 long — safe in a URL and easy to type. */
export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

/** Usernames are stored lowercase and without a leading @, whatever the user typed. */
export const normalizeUsername = (value: string): string => value.trim().replace(/^@+/, "").toLowerCase();

export const isValidUsername = (value: string): boolean => USERNAME_PATTERN.test(normalizeUsername(value));
