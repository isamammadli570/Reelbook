/** Lowercase letters, digits and underscores, 3 to 20 long — safe in a URL and easy to type. */
export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

/** Usernames are stored lowercase and without a leading @, whatever the user typed. */
export const normalizeUsername = (value: string): string => value.trim().replace(/^@+/, "").toLowerCase();

export const isValidUsername = (value: string): boolean => USERNAME_PATTERN.test(normalizeUsername(value));

/** Letters from the app's languages written the way a handle can hold them. */
const LATIN: Record<string, string> = {
    ə: "e", ı: "i", ö: "o", ü: "u", ş: "s", ç: "c", ğ: "g",
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
    н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
    ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

const toHandle = (text: string): string =>
    [...text.toLocaleLowerCase("az")]
        .map((char) => LATIN[char] ?? char)
        .join("")
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 20)
        .replace(/_+$/, "");

/**
 * A first guess at a handle for an account that has none, such as one made with Google: from the name
 * ("İsa Məmmədli" → "isa_memmedli"), else the email ("isa.m@gmail.com" → "isa_m"). Too short becomes empty.
 */
export const suggestUsername = (name: string | null | undefined, email: string | null | undefined): string => {
    const fromName = toHandle(name ?? "");
    if (fromName.length >= 3) return fromName;
    const fromEmail = toHandle((email ?? "").split("@")[0]);
    return fromEmail.length >= 3 ? fromEmail : "";
};
