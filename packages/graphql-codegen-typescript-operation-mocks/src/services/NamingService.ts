import type { AtomicService, ServiceValidationResult } from "./AtomicService";
import { createValidResult, createInvalidResult } from "./AtomicService";

/**
 * Configuration options for naming behavior.
 */
export interface NamingConfig {
    /** Whether to add operation suffixes (Query, Mutation, Subscription, Fragment) to type names */
    addOperationSuffix?: boolean;
}

/**
 * Service responsible for generating consistent names throughout the plugin.
 *
 * This service handles:
 * - Builder function naming (e.g., "aGetTodos", "aAddTodo")
 * - Type naming with optional operation suffixes (e.g., "GetTodosQuery", "AddTodoMutation", "AuthorFieldsFragment")
 * - Operation type inference from names
 * - Naming convention validation and consistency
 */
export class NamingService implements AtomicService {
    readonly serviceName = "NamingService";
    private readonly config: NamingConfig;

    constructor(config: NamingConfig = {}) {
        this.config = {
            addOperationSuffix: true,
            ...config,
        };
    }

    /**
     * Generates a builder function name with the proper 'a' prefix and operation suffix.
     *
     * @param mockName - The base mock name (e.g., 'GetUser', 'AddTodo')
     * @param operationType - The operation type (query, mutation, subscription, fragment)
     * @returns Builder function name with 'a' prefix and suffix (e.g., 'aGetUserQuery', 'aAddTodoMutation')
     */
    generateBuilderName(
        mockName: string,
        operationType?: "query" | "mutation" | "subscription" | "fragment",
    ): string {
        if (operationType) {
            const typeName = this.generateTypeName(mockName, operationType);
            return `a${typeName}`;
        }
        // Fallback for backward compatibility when no operation type provided
        return `a${mockName}`;
    }

    /**
     * Generates the proper type name with optional operation suffix.
     *
     * @param operationName - The base operation name (e.g., 'GetTodos', 'AddTodo', 'AuthorFields')
     * @param operationType - The operation type (query, mutation, subscription, fragment)
     * @returns Type name with optional suffix based on configuration
     */
    generateTypeName(
        operationName: string,
        operationType: "query" | "mutation" | "subscription" | "fragment",
    ): string {
        // Add suffix for all operation types if configured to do so
        if (this.config.addOperationSuffix) {
            const suffix =
                operationType.charAt(0).toUpperCase() + operationType.slice(1);
            return `${operationName}${suffix}`;
        }

        return operationName;
    }

    /**
     * Infers the operation type from the mock name based on naming conventions.
     *
     * @param mockName - The name of the mock data object
     * @returns Inferred operation type (query, mutation, subscription, or fragment)
     */
    inferOperationType(
        mockName: string,
    ): "query" | "mutation" | "subscription" | "fragment" {
        const lowerName = mockName.toLowerCase();

        if (
            lowerName.includes("query") ||
            lowerName.startsWith("get") ||
            lowerName.startsWith("fetch")
        ) {
            return "query";
        } else if (
            lowerName.includes("mutation") ||
            lowerName.startsWith("add") ||
            lowerName.startsWith("update") ||
            lowerName.startsWith("delete") ||
            lowerName.startsWith("create")
        ) {
            return "mutation";
        } else if (
            lowerName.includes("subscription") ||
            lowerName.startsWith("subscribe") ||
            lowerName.startsWith("on")
        ) {
            return "subscription";
        } else {
            return "fragment";
        }
    }

    /**
     * Generates consistent variant names for union types.
     *
     * @param operationName - Base operation name
     * @param typeName - The specific union member type name
     * @returns Generated variant name (e.g., "SearchQueryAsUser")
     */
    generateVariantName(operationName: string, typeName: string): string {
        return `${operationName}As${typeName}`;
    }

    /**
     * Validates that a name follows plugin conventions.
     *
     * @param name - The name to validate
     * @param type - The type of name being validated
     * @returns Validation result
     */
    validateName(
        name: string,
        type: "builder" | "type" | "operation",
    ): NameValidation {
        const errors: string[] = [];

        if (!name || name.trim().length === 0) {
            errors.push("Name cannot be empty");
        }

        if (type === "builder") {
            if (!name.startsWith("a")) {
                errors.push("Builder names must start with 'a' prefix");
            }
            if (name.length < 2) {
                errors.push("Builder name too short");
            }
        }

        if (type === "type") {
            if (!this.isPascalCase(name)) {
                errors.push("Type names must be in PascalCase");
            }
        }

        if (type === "operation") {
            if (!this.isPascalCase(name)) {
                errors.push("Operation names must be in PascalCase");
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Normalizes operation names to ensure consistency.
     *
     * @param rawName - Raw operation name from GraphQL
     * @returns Normalized name suitable for code generation
     */
    normalizeOperationName(rawName: string): string {
        let normalized = rawName;

        // Only remove suffixes if we're configured to add them back
        if (this.config.addOperationSuffix) {
            // First, remove lowercase suffixes (for snake_case/kebab-case inputs)
            normalized = normalized
                .replace(/[_-]?query$/i, "")
                .replace(/[_-]?mutation$/i, "")
                .replace(/[_-]?subscription$/i, "")
                .replace(/[_-]?fragment$/i, "");
        }

        // Convert to PascalCase
        normalized = this.toPascalCase(normalized);

        // Then remove PascalCase suffixes (for already PascalCase inputs)
        if (this.config.addOperationSuffix) {
            normalized = normalized
                .replace(/Query$/, "")
                .replace(/Mutation$/, "")
                .replace(/Subscription$/, "")
                .replace(/Fragment$/, "");
        }

        return normalized;
    }

    /**
     * Gets the current naming configuration.
     */
    getConfig(): NamingConfig {
        return { ...this.config };
    }

    /**
     * Validates that the service is properly configured and ready to use.
     * @returns Validation result with any errors found
     */
    validate(): ServiceValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Validate configuration
        if (
            typeof this.config.addOperationSuffix !== "boolean" &&
            this.config.addOperationSuffix !== undefined
        ) {
            errors.push("addOperationSuffix must be a boolean value");
        }

        // Test core functionality
        try {
            // Test builder name generation
            const testBuilderName = this.generateBuilderName(
                "TestOperation",
                "query",
            );
            if (!testBuilderName.startsWith("a")) {
                errors.push("Builder name generation is not working correctly");
            }

            // Test type name generation
            const testTypeName = this.generateTypeName(
                "TestOperation",
                "query",
            );
            if (!testTypeName || testTypeName.length === 0) {
                errors.push("Type name generation is not working correctly");
            }

            // Test operation type inference
            const inferredType = this.inferOperationType("GetUser");
            if (
                !["query", "mutation", "subscription", "fragment"].includes(
                    inferredType,
                )
            ) {
                errors.push(
                    "Operation type inference is not working correctly",
                );
            }
        } catch (error) {
            errors.push(
                `Service validation failed with error: ${error instanceof Error ? error.message : String(error)}`,
            );
        }

        return errors.length > 0
            ? createInvalidResult(errors, warnings)
            : createValidResult();
    }

    /**
     * Checks if a string is in PascalCase.
     */
    private isPascalCase(str: string): boolean {
        return /^[A-Z][a-zA-Z0-9]*$/.test(str);
    }

    /**
     * Converts a string to PascalCase.
     */
    private toPascalCase(str: string): string {
        // Handle already PascalCase strings
        if (this.isPascalCase(str)) {
            return str;
        }

        return str
            .split(/[\s_-]+/)
            .map(
                (word) =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
            )
            .join("");
    }
}

/**
 * Result of name validation.
 */
export interface NameValidation {
    isValid: boolean;
    errors: string[];
}
