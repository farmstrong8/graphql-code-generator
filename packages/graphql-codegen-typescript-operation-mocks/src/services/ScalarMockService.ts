import type { TypeScriptMockDataPluginConfig } from "../config/types";
import casual from "casual";

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
     * @returns A realistic mock value for the scalar type
     */
    generateMockValue(
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
     *
     * @param scalarName - The primitive scalar type name
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
     * Checks if a given key is a valid property/method on the casual object.
     *
     * @param key - The key to check
     * @returns True if the key exists on casual and can be used for mock generation
     */
    private isValidCasualKey(key: string): key is keyof typeof casual {
        return key in casual;
    }
}
