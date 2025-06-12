import type { GraphQLSchema } from "graphql";
import { PluginConfig } from "../config/PluginConfig";
import type { TypeScriptMockDataPluginConfig } from "../config/types";
import casual from "casual";

/**
 * Handles the generation of mock values for GraphQL scalar types.
 *
 * This handler manages both primitive GraphQL scalars (String, Int, Float, Boolean, ID)
 * and custom scalars defined in the plugin configuration. It includes all scalar-related
 * utilities and validation logic in a single, cohesive service.
 */
export class ScalarHandler {
    constructor(private readonly config: PluginConfig) {}

    /**
     * Generates a mock value for the specified scalar type.
     *
     * @param scalarName - The name of the scalar type
     * @returns A mock value appropriate for the scalar type
     */
    generateMockValue(scalarName: string): unknown {
        return this.generateScalarMock(scalarName, this.config.getRawConfig());
    }

    /**
     * Generates mock values for scalar types based on configuration.
     *
     * This function handles both primitive GraphQL scalars (String, Int, etc.)
     * and custom scalars defined in the plugin configuration.
     *
     * @param scalarName - The name of the scalar type
     * @param config - Plugin configuration containing scalar definitions
     * @returns A mock value appropriate for the scalar type
     */
    private generateScalarMock(
        scalarName: string,
        config: TypeScriptMockDataPluginConfig,
    ): unknown {
        // Handle primitive GraphQL scalars first
        if (this.isPrimitiveScalar(scalarName)) {
            return this.generatePrimitiveScalarMock(scalarName);
        }

        // Look up custom scalar configuration
        const scalarConfig = config.scalars?.[scalarName];

        if (!scalarConfig) {
            return `${scalarName.toLowerCase()}-mock`; // fallback for unknown scalars
        }

        // Handle string-based generator (e.g., "date", "email")
        if (typeof scalarConfig === "string") {
            if (ScalarHandler.isValidCasualKey(scalarConfig)) {
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

            if (ScalarHandler.isValidCasualKey(generator)) {
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
     * Generates mock values for GraphQL primitive scalar types.
     *
     * @param scalarName - The name of the primitive scalar type
     * @returns A mock value appropriate for the scalar type
     */
    private generatePrimitiveScalarMock(scalarName: string): unknown {
        switch (scalarName) {
            case "ID":
                return casual.uuid;
            case "String":
                return casual.sentence;
            case "Int":
                return casual.integer();
            case "Float":
                return casual.double();
            case "Boolean":
                return casual.boolean;
            default:
                return `${scalarName.toLowerCase()}-mock`;
        }
    }

    /**
     * Utility to check if a scalar type is a GraphQL primitive scalar.
     *
     * @param scalarName - The name of the scalar type to check
     * @returns True if the scalar is a primitive GraphQL scalar
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
     * Checks if a given key is a valid property/method on the casual object.
     *
     * @param key - The key to check
     * @returns True if the key exists on casual and can be used for mock generation
     */
    static isValidCasualKey(key: string): key is keyof typeof casual {
        return key in casual;
    }
}
