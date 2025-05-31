import casual from "casual";
import type { TypeScriptMockDataPluginConfig } from "../../config/types";
import { isValidCasualKey } from "./isValidCasualKey";
import { isPrimitiveScalar } from "./isPrimitiveScalar";
import { generatePrimitiveScalarMock } from "./generatePrimitiveScalarMock";

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
export function generateScalarMock(
    scalarName: string,
    config: TypeScriptMockDataPluginConfig,
): unknown {
    // Handle primitive GraphQL scalars first
    if (isPrimitiveScalar(scalarName)) {
        return generatePrimitiveScalarMock(scalarName);
    }

    // Look up custom scalar configuration
    const scalarConfig = config.scalars?.[scalarName];

    if (!scalarConfig) {
        return `${scalarName.toLowerCase()}-mock`; // fallback for unknown scalars
    }

    // Handle string-based generator (e.g., "date", "email")
    if (typeof scalarConfig === "string") {
        if (isValidCasualKey(scalarConfig)) {
            const generator = casual[scalarConfig];
            return typeof generator === "function" ? generator() : generator;
        }
        throw new Error(
            `Invalid casual generator "${scalarConfig}" for scalar "${scalarName}"`,
        );
    }

    // Handle object-based configuration with generator and arguments
    if (typeof scalarConfig === "object") {
        const { generator, arguments: args = [] } = scalarConfig;

        if (isValidCasualKey(generator)) {
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
