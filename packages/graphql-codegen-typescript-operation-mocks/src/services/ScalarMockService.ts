import type { TypeScriptMockDataPluginConfig } from "../config/types";
import casual from "casual";
import { createHash, randomUUID } from "crypto";

/**
 * Micro-service responsible for generating mock values for GraphQL scalar types.
 *
 * This service handles the mapping of GraphQL scalars to realistic mock values
 * using the casual.js library and user-defined configurations.
 */
export class ScalarMockService {
    /**
     * Generates a mock value for a specific GraphQL scalar type.
     *
     * @param scalarName - The name of the GraphQL scalar type
     * @param config - Plugin configuration with scalar mappings
     * @param context - Optional context for deterministic generation (e.g., builder name)
     * @returns A realistic mock value for the scalar type
     */
    generateMockValue(
        scalarName: string,
        config: TypeScriptMockDataPluginConfig,
        context?: string,
    ): unknown {
        // Handle primitive GraphQL scalars first
        if (this.isPrimitiveScalar(scalarName)) {
            return this.generatePrimitiveScalarMock(scalarName, context);
        }

        // Look up custom scalar configuration
        const scalarConfig = config.scalars?.[scalarName];

        if (!scalarConfig) {
            return `${scalarName.toLowerCase()}-mock`; // fallback for unknown scalars
        }

        // Handle string-based generator (e.g., "date", "email")
        if (typeof scalarConfig === "string") {
            if (this.isValidCasualKey(scalarConfig)) {
                const generator = casual[scalarConfig];
                return typeof generator === "function"
                    ? generator()
                    : generator;
            }
            throw new Error(
                `Invalid casual generator "${scalarConfig}" for scalar "${scalarName}"`,
            );
        }

        // Handle object-based configuration with generator and arguments
        if (typeof scalarConfig === "object") {
            const { generator, arguments: args = [] } = scalarConfig;

            if (this.isValidCasualKey(generator)) {
                const fn = casual[generator];
                if (typeof fn === "function") {
                    return Array.isArray(args) ? fn(...args) : fn(args);
                } else {
                    return fn;
                }
            }
            throw new Error(
                `Invalid casual generator "${generator}" for scalar "${scalarName}"`,
            );
        }

        throw new Error(
            `Unknown scalar config for "${scalarName}": ${JSON.stringify(
                scalarConfig,
            )}`,
        );
    }

    /**
     * Generates a mock value for a GraphQL enum type.
     * Always returns the first enum value for consistency.
     *
     * @param enumValues - Array of enum values
     * @returns The first enum value
     */
    generateEnumValue(enumValues: readonly string[]): string {
        if (enumValues.length === 0) {
            throw new Error("Enum type has no values");
        }
        // Always return the first enum value for consistency
        return enumValues[0];
    }

    /**
     * Checks if a scalar type is a primitive GraphQL scalar.
     *
     * @param scalarName - The scalar type name to check
     * @returns True if the scalar is a GraphQL primitive
     */
    private isPrimitiveScalar(scalarName: string): boolean {
        const graphqlPrimitiveScalars = [
            "String",
            "Int",
            "Float",
            "Boolean",
            "ID",
        ];
        return graphqlPrimitiveScalars.includes(scalarName);
    }

    /**
     * Generates mock values for primitive GraphQL scalar types.
     * Uses deterministic values for Boolean and ID types to ensure test stability.
     *
     * @param scalarName - The primitive scalar type name
     * @param context - Optional context for deterministic generation
     * @returns A mock value appropriate for the scalar type
     */
    private generatePrimitiveScalarMock(
        scalarName: string,
        context?: string,
    ): unknown {
        switch (scalarName) {
            case "ID":
                // Generate deterministic ID based on context (builder name)
                if (context) {
                    return this.generateDeterministicId(context);
                }
                // Generate a random UUID when no context is provided
                return randomUUID();
            case "String":
                return casual.sentence;
            case "Int":
                return casual.integer();
            case "Float":
                return casual.double();
            case "Boolean":
                // Always return true for consistency and test stability
                return true;
            default:
                return `${scalarName.toLowerCase()}-mock`;
        }
    }

    /**
     * Generates a deterministic UUID-like ID based on the input context.
     * This ensures consistent IDs for the same builder names across runs.
     *
     * @param context - The context string (e.g., builder name) to hash
     * @returns A deterministic UUID-like string
     */
    private generateDeterministicId(context: string): string {
        // Create a hash of the context
        const hash = createHash("sha256").update(context).digest("hex");

        // Format as UUID: 8-4-4-4-12 characters
        return [
            hash.substring(0, 8),
            hash.substring(8, 12),
            hash.substring(12, 16),
            hash.substring(16, 20),
            hash.substring(20, 32),
        ].join("-");
    }

    /**
     * Checks if a given key is a valid property/method on the casual object.
     *
     * @param key - The key to check
     * @returns True if the key exists on casual and can be used for mock generation
     */
    private isValidCasualKey(key: string): key is keyof typeof casual {
        return key in casual;
    }
}
