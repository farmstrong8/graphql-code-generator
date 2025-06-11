/**
 * Fragment Utilities
 *
 * Shared utilities for working with GraphQL fragments across different services.
 * This module consolidates common fragment-related logic to avoid code duplication.
 */

/**
 * Extracts the target type name from a fragment name using common naming patterns.
 *
 * Common patterns supported:
 * - "AuthorFragment" -> "Author"
 * - "UserFields" -> "User"
 * - "PostDetails" -> "Post"
 * - "TodoInfo" -> "Todo"
 * - "ProfileData" -> "Profile"
 * - "SettingsProps" -> "Settings"
 *
 * @param fragmentName - Fragment name (e.g., "AuthorFragment", "UserFields", "PostDetails")
 * @returns The extracted type name or null if cannot be determined
 *
 * @example
 * ```typescript
 * extractTypeNameFromFragmentName("AuthorFragment") // "Author"
 * extractTypeNameFromFragmentName("UserFields") // "User"
 * extractTypeNameFromFragmentName("PostDetails") // "Post"
 * extractTypeNameFromFragmentName("UnknownPattern") // "UnknownPattern"
 * ```
 */
export function extractTypeNameFromFragmentName(
    fragmentName: string,
): string | null {
    if (typeof fragmentName !== "string") {
        return null;
    }

    // Handle empty string case - return empty string as expected by tests
    if (fragmentName === "") {
        return "";
    }

    // Remove common fragment suffixes
    const suffixes = ["Fragment", "Fields", "Details", "Info", "Data", "Props"];

    for (const suffix of suffixes) {
        if (fragmentName.endsWith(suffix)) {
            const extractedName = fragmentName.slice(0, -suffix.length);
            // Ensure we don't return empty string after suffix removal
            return extractedName.length > 0 ? extractedName : null;
        }
    }

    // If no suffix pattern matches, assume the fragment name is the type name
    return fragmentName;
}
