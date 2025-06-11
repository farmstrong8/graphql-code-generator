import { describe, it, expect } from "vitest";
import { extractTypeNameFromFragmentName } from "../fragmentUtils";

describe("fragmentUtils", () => {
    describe("extractTypeNameFromFragmentName", () => {
        it("should extract type names from common fragment patterns", () => {
            expect(extractTypeNameFromFragmentName("AuthorFragment")).toBe(
                "Author",
            );
            expect(extractTypeNameFromFragmentName("UserFields")).toBe("User");
            expect(extractTypeNameFromFragmentName("PostDetails")).toBe("Post");
            expect(extractTypeNameFromFragmentName("TodoInfo")).toBe("Todo");
            expect(extractTypeNameFromFragmentName("ProfileData")).toBe(
                "Profile",
            );
            expect(extractTypeNameFromFragmentName("SettingsProps")).toBe(
                "Settings",
            );
        });

        it("should handle fragment names without common suffixes", () => {
            expect(extractTypeNameFromFragmentName("Author")).toBe("Author");
            expect(extractTypeNameFromFragmentName("User")).toBe("User");
            expect(extractTypeNameFromFragmentName("CustomTypeName")).toBe(
                "CustomTypeName",
            );
        });

        it("should handle edge cases", () => {
            expect(extractTypeNameFromFragmentName("")).toBe("");
            expect(extractTypeNameFromFragmentName("Fragment")).toBe(null); // Would result in empty string
            expect(extractTypeNameFromFragmentName("Fields")).toBe(null); // Would result in empty string
            expect(extractTypeNameFromFragmentName("A")).toBe("A");
        });

        it("should handle invalid inputs", () => {
            expect(extractTypeNameFromFragmentName(null as any)).toBe(null);
            expect(extractTypeNameFromFragmentName(undefined as any)).toBe(
                null,
            );
            expect(extractTypeNameFromFragmentName(123 as any)).toBe(null);
        });

        it("should prioritize first matching suffix", () => {
            // If a fragment name has multiple suffixes, it should use the first match
            expect(extractTypeNameFromFragmentName("DataInfoFragment")).toBe(
                "DataInfo",
            );
        });

        it("should handle case sensitivity", () => {
            expect(extractTypeNameFromFragmentName("AuthorFRAGMENT")).toBe(
                "AuthorFRAGMENT",
            ); // No match, case sensitive
            expect(extractTypeNameFromFragmentName("userfields")).toBe(
                "userfields",
            ); // No match, case sensitive
        });
    });
});
