import { describe, it, expect } from "vitest";
import { FragmentService } from "../../services/FragmentService";

describe("FragmentService", () => {
    const fragmentService = new FragmentService();

    describe("extractTypeNameFromFragmentName", () => {
        it("should extract type names from common fragment patterns", () => {
            expect(
                fragmentService.extractTypeNameFromFragmentName(
                    "AuthorFragment",
                ),
            ).toBe("Author");
            expect(
                fragmentService.extractTypeNameFromFragmentName("UserFields"),
            ).toBe("User");
            expect(
                fragmentService.extractTypeNameFromFragmentName("PostDetails"),
            ).toBe("Post");
            expect(
                fragmentService.extractTypeNameFromFragmentName("TodoInfo"),
            ).toBe("Todo");
            expect(
                fragmentService.extractTypeNameFromFragmentName("ProfileData"),
            ).toBe("Profile");
            expect(
                fragmentService.extractTypeNameFromFragmentName(
                    "SettingsProps",
                ),
            ).toBe("Settings");
        });

        it("should handle fragment names without common suffixes", () => {
            expect(
                fragmentService.extractTypeNameFromFragmentName("Author"),
            ).toBe("Author");
            expect(
                fragmentService.extractTypeNameFromFragmentName("User"),
            ).toBe("User");
            expect(
                fragmentService.extractTypeNameFromFragmentName(
                    "CustomTypeName",
                ),
            ).toBe("CustomTypeName");
        });

        it("should handle edge cases", () => {
            expect(fragmentService.extractTypeNameFromFragmentName("")).toBe(
                "",
            );
            expect(
                fragmentService.extractTypeNameFromFragmentName("Fragment"),
            ).toBe(null); // Would result in empty string
            expect(
                fragmentService.extractTypeNameFromFragmentName("Fields"),
            ).toBe(null); // Would result in empty string
            expect(fragmentService.extractTypeNameFromFragmentName("A")).toBe(
                "A",
            );
        });

        it("should handle invalid inputs", () => {
            expect(
                fragmentService.extractTypeNameFromFragmentName(null as any),
            ).toBe(null);
            expect(
                fragmentService.extractTypeNameFromFragmentName(
                    undefined as any,
                ),
            ).toBe(null);
            expect(
                fragmentService.extractTypeNameFromFragmentName(123 as any),
            ).toBe(null);
        });

        it("should prioritize first matching suffix", () => {
            // If a fragment name has multiple suffixes, it should use the first match
            expect(
                fragmentService.extractTypeNameFromFragmentName(
                    "DataInfoFragment",
                ),
            ).toBe("DataInfo");
        });

        it("should handle case sensitivity", () => {
            expect(
                fragmentService.extractTypeNameFromFragmentName(
                    "AuthorFRAGMENT",
                ),
            ).toBe("AuthorFRAGMENT"); // No match, case sensitive
            expect(
                fragmentService.extractTypeNameFromFragmentName("userfields"),
            ).toBe("userfields"); // No match, case sensitive
        });
    });
});
