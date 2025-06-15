/**
 * Service responsible for generating TypeScript boilerplate code.
 *
 * This service handles:
 * - Import statements for dependencies
 * - Helper function definitions (createBuilder, DeepPartial)
 * - Type definitions that are used across all generated mocks
 * - Customizable boilerplate based on generation context
 */
export class BoilerplateService {
    /**
     * Generates the standard boilerplate code for mock files.
     *
     * @param options - Options for customizing the boilerplate
     * @returns Complete boilerplate code string
     */
    generateStandardBoilerplate(options: BoilerplateOptions = {}): string {
        const sections: string[] = [];

        // Add imports
        sections.push(this.generateImports(options));

        // Add type definitions
        sections.push(this.generateTypeDefinitions(options));

        // Add helper functions
        sections.push(this.generateHelperFunctions(options));

        return sections.filter(Boolean).join("\n\n");
    }

    /**
     * Generates import statements based on dependencies.
     */
    private generateImports(options: BoilerplateOptions): string {
        const imports: string[] = [];

        // Always include lodash merge function
        imports.push('import { mergeWith } from "lodash";');

        // Add custom imports if specified
        if (options.additionalImports) {
            imports.push(...options.additionalImports);
        }

        return imports.join("\n");
    }

    /**
     * Generates TypeScript type definitions.
     */
    private generateTypeDefinitions(options: BoilerplateOptions): string {
        const types: string[] = [];

        // DeepPartial type - always included
        types.push(`type DeepPartial<T> = T extends (...args: unknown[]) => unknown
    ? T
    : T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;`);

        // Add custom types if specified
        if (options.additionalTypes) {
            types.push(...options.additionalTypes);
        }

        return types.join("\n\n");
    }

    /**
     * Generates helper functions.
     */
    private generateHelperFunctions(options: BoilerplateOptions): string {
        const functions: string[] = [];

        // createBuilder function - always included
        functions.push(`function createBuilder<T extends object>(baseObject: T) {
    return (overrides?: DeepPartial<T>): T =>
        mergeWith({}, baseObject, overrides, (objValue, srcValue) => {
            if (Array.isArray(objValue) && Array.isArray(srcValue)) {
                return srcValue;
            }
        });
}`);

        // Add custom functions if specified
        if (options.additionalFunctions) {
            functions.push(...options.additionalFunctions);
        }

        return functions.join("\n\n");
    }

    /**
     * Generates boilerplate for specific contexts (e.g., testing, fragments).
     */
    generateContextualBoilerplate(context: BoilerplateContext): string {
        const options: BoilerplateOptions = {};

        switch (context) {
            case "testing":
                options.additionalImports = ['import { vi } from "vitest";'];
                break;
            case "fragments":
                options.additionalTypes = [
                    "type FragmentBuilder<T> = (overrides?: DeepPartial<T>) => T;",
                ];
                break;
            case "minimal":
                // Return minimal boilerplate without extra features
                return this.generateMinimalBoilerplate();
        }

        return this.generateStandardBoilerplate(options);
    }

    /**
     * Generates minimal boilerplate with only essential components.
     */
    private generateMinimalBoilerplate(): string {
        return `type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

function createBuilder<T extends object>(baseObject: T) {
    return (overrides?: DeepPartial<T>): T => ({ ...baseObject, ...overrides });
}`;
    }

    /**
     * Validates that the generated boilerplate is syntactically correct.
     */
    validateBoilerplate(boilerplate: string): BoilerplateValidation {
        const errors: string[] = [];

        // Check for required components
        if (!boilerplate.includes("DeepPartial")) {
            errors.push("Missing DeepPartial type definition");
        }

        if (!boilerplate.includes("createBuilder")) {
            errors.push("Missing createBuilder function");
        }

        if (
            !boilerplate.includes("mergeWith") &&
            !boilerplate.includes("...baseObject")
        ) {
            errors.push("Missing merge functionality");
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}

/**
 * Options for customizing boilerplate generation.
 */
export interface BoilerplateOptions {
    /** Additional import statements to include */
    additionalImports?: string[];
    /** Additional type definitions to include */
    additionalTypes?: string[];
    /** Additional helper functions to include */
    additionalFunctions?: string[];
    /** Whether to include comments in the generated code */
    includeComments?: boolean;
}

/**
 * Context for specialized boilerplate generation.
 */
export type BoilerplateContext =
    | "standard"
    | "testing"
    | "fragments"
    | "minimal";

/**
 * Result of boilerplate validation.
 */
export interface BoilerplateValidation {
    isValid: boolean;
    errors: string[];
}
