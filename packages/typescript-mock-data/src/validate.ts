import type { PluginValidateFn } from "@graphql-codegen/plugin-helpers";
import { GraphQLScalarType } from "graphql";
import type { TypeScriptMockDataPluginConfig } from "./config/types";
import { isValidCasualKey } from "./utils/scalars";

/**
 * GraphQL Code Generator validation function for TypeScript mock data plugin.
 *
 * This function validates that all custom scalars in the schema have corresponding
 * mock configurations, and that the configurations are valid.
 */
export const validate: PluginValidateFn<TypeScriptMockDataPluginConfig> = (
    schema,
    documents,
    config,
) => {
    // Get all custom scalar types from the schema (excluding built-in GraphQL scalars)
    const scalarTypeMap = schema.getTypeMap();
    const customScalars = Object.values(scalarTypeMap)
        .filter((type) => type instanceof GraphQLScalarType)
        .map((scalar) => scalar.name)
        .filter(
            (name) =>
                !["String", "ID", "Boolean", "Int", "Float"].includes(name),
        );

    const configuredScalars = Object.keys(config.scalars || {});

    // Check for missing scalar mock definitions
    const missingMocks = customScalars.filter(
        (scalarName) => !configuredScalars.includes(scalarName),
    );

    if (missingMocks.length > 0) {
        throw new Error(
            `Missing scalar mock definitions for: ${missingMocks.join(
                ", ",
            )}.\n` + `Please add them to your plugin config under 'scalars'.`,
        );
    }

    // Validate that configured scalar mock definitions are valid
    if (config.scalars) {
        validateScalarConfigurations(config.scalars);
    }
};

/**
 * Validates that scalar configurations use valid casual.js generators.
 */
function validateScalarConfigurations(scalars: Record<string, any>): void {
    for (const [scalarName, scalarConfig] of Object.entries(scalars)) {
        if (typeof scalarConfig === "string") {
            // Validate casual.js generator name
            if (!isValidCasualKey(scalarConfig)) {
                throw new Error(
                    `Invalid casual.js generator "${scalarConfig}" for scalar "${scalarName}". ` +
                        `Check the casual.js documentation for valid generator names.`,
                );
            }
        } else if (typeof scalarConfig === "object" && scalarConfig !== null) {
            // Validate object-based configuration
            const { generator, arguments: args } = scalarConfig;

            if (!generator || typeof generator !== "string") {
                throw new Error(
                    `Scalar "${scalarName}" must have a "generator" property with a string value`,
                );
            }

            if (!isValidCasualKey(generator)) {
                throw new Error(
                    `Invalid casual.js generator "${generator}" for scalar "${scalarName}". ` +
                        `Check the casual.js documentation for valid generator names.`,
                );
            }

            // Allow arguments to be a single value (string/number) or an array
            if (
                args !== undefined &&
                !Array.isArray(args) &&
                typeof args !== "string" &&
                typeof args !== "number"
            ) {
                throw new Error(
                    `Arguments for scalar "${scalarName}" must be a string, number, or array`,
                );
            }
        } else {
            throw new Error(
                `Invalid configuration for scalar "${scalarName}". ` +
                    `Expected string or object with generator property.`,
            );
        }
    }
}
