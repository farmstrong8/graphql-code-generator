import casual from "casual";

/**
 * Checks if a given key is a valid property/method on the casual object.
 *
 * @param key - The key to check
 * @returns True if the key exists on casual and can be used for mock generation
 */
export function isValidCasualKey(key: string): key is keyof typeof casual {
    return key in casual;
}
