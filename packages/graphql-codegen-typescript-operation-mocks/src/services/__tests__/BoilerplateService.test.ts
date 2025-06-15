import { describe, it, expect, beforeEach } from "vitest";
import { BoilerplateService } from "../BoilerplateService";

describe("BoilerplateService", () => {
    let boilerplateService: BoilerplateService;

    beforeEach(() => {
        boilerplateService = new BoilerplateService();
    });

    describe("generateStandardBoilerplate", () => {
        it("should generate standard boilerplate with all required components", () => {
            const boilerplate =
                boilerplateService.generateStandardBoilerplate();

            expect(boilerplate).toContain('import { mergeWith } from "lodash"');
            expect(boilerplate).toContain("type DeepPartial<T>");
            expect(boilerplate).toContain(
                "function createBuilder<T extends object>",
            );
            expect(boilerplate).toContain(
                "mergeWith({}, baseObject, overrides",
            );
        });

        it("should include additional imports when specified", () => {
            const boilerplate = boilerplateService.generateStandardBoilerplate({
                additionalImports: ['import { vi } from "vitest";'],
            });

            expect(boilerplate).toContain('import { mergeWith } from "lodash"');
            expect(boilerplate).toContain('import { vi } from "vitest";');
        });

        it("should include additional types when specified", () => {
            const boilerplate = boilerplateService.generateStandardBoilerplate({
                additionalTypes: ["type CustomType = { id: string; };"],
            });

            expect(boilerplate).toContain("type DeepPartial<T>");
            expect(boilerplate).toContain("type CustomType = { id: string; };");
        });

        it("should include additional functions when specified", () => {
            const boilerplate = boilerplateService.generateStandardBoilerplate({
                additionalFunctions: [
                    "function customHelper() { return true; }",
                ],
            });

            expect(boilerplate).toContain(
                "function createBuilder<T extends object>",
            );
            expect(boilerplate).toContain(
                "function customHelper() { return true; }",
            );
        });
    });

    describe("generateContextualBoilerplate", () => {
        it("should generate testing context boilerplate", () => {
            const boilerplate =
                boilerplateService.generateContextualBoilerplate("testing");

            expect(boilerplate).toContain('import { vi } from "vitest";');
            expect(boilerplate).toContain("type DeepPartial<T>");
            expect(boilerplate).toContain(
                "function createBuilder<T extends object>",
            );
        });

        it("should generate fragments context boilerplate", () => {
            const boilerplate =
                boilerplateService.generateContextualBoilerplate("fragments");

            expect(boilerplate).toContain("type FragmentBuilder<T>");
            expect(boilerplate).toContain("type DeepPartial<T>");
            expect(boilerplate).toContain(
                "function createBuilder<T extends object>",
            );
        });

        it("should generate minimal context boilerplate", () => {
            const boilerplate =
                boilerplateService.generateContextualBoilerplate("minimal");

            expect(boilerplate).toContain("type DeepPartial<T>");
            expect(boilerplate).toContain(
                "function createBuilder<T extends object>",
            );
            expect(boilerplate).not.toContain("mergeWith");
            expect(boilerplate).toContain("...baseObject");
        });

        it("should generate standard context boilerplate", () => {
            const boilerplate =
                boilerplateService.generateContextualBoilerplate("standard");

            expect(boilerplate).toContain('import { mergeWith } from "lodash"');
            expect(boilerplate).toContain("type DeepPartial<T>");
            expect(boilerplate).toContain(
                "function createBuilder<T extends object>",
            );
        });
    });

    describe("validateBoilerplate", () => {
        it("should validate correct boilerplate", () => {
            const boilerplate =
                boilerplateService.generateStandardBoilerplate();
            const validation =
                boilerplateService.validateBoilerplate(boilerplate);

            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });

        it("should detect missing DeepPartial type", () => {
            const boilerplate = `
                import { mergeWith } from "lodash";
                function createBuilder<T extends object>(baseObject: T) {
                    return (overrides?: any): T => mergeWith({}, baseObject, overrides);
                }
            `;

            const validation =
                boilerplateService.validateBoilerplate(boilerplate);

            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContain(
                "Missing DeepPartial type definition",
            );
        });

        it("should detect missing createBuilder function", () => {
            const boilerplate = `
                import { mergeWith } from "lodash";
                type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;
            `;

            const validation =
                boilerplateService.validateBoilerplate(boilerplate);

            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContain(
                "Missing createBuilder function",
            );
        });

        it("should detect missing merge functionality", () => {
            const boilerplate = `
                type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;
                function createBuilder<T extends object>(baseObject: T) {
                    return (overrides?: DeepPartial<T>): T => baseObject;
                }
            `;

            const validation =
                boilerplateService.validateBoilerplate(boilerplate);

            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContain("Missing merge functionality");
        });

        it("should validate minimal boilerplate with spread operator", () => {
            const boilerplate = `
                type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;
                function createBuilder<T extends object>(baseObject: T) {
                    return (overrides?: DeepPartial<T>): T => ({ ...baseObject, ...overrides });
                }
            `;

            const validation =
                boilerplateService.validateBoilerplate(boilerplate);

            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });
    });

    describe("edge cases", () => {
        it("should handle empty options gracefully", () => {
            const boilerplate = boilerplateService.generateStandardBoilerplate(
                {},
            );

            expect(boilerplate).toContain("type DeepPartial<T>");
            expect(boilerplate).toContain(
                "function createBuilder<T extends object>",
            );
        });

        it("should handle undefined options gracefully", () => {
            const boilerplate =
                boilerplateService.generateStandardBoilerplate(undefined);

            expect(boilerplate).toContain("type DeepPartial<T>");
            expect(boilerplate).toContain(
                "function createBuilder<T extends object>",
            );
        });
    });
});
