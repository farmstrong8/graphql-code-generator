import type {
    TypeScriptMockDataPluginConfig,
    ScalarGeneratorConfig,
} from "./types";

/**
 * Configuration management for the mock data plugin.
 *
 * This class provides a clean interface for accessing and validating
 * plugin configuration options, particularly around scalar mock generation.
 */
export class PluginConfig {
    constructor(
        private readonly rawConfig: TypeScriptMockDataPluginConfig = {},
    ) {}

    /**
     * Gets the raw configuration object.
     *
     * @returns The raw plugin configuration
     */
    getRawConfig(): TypeScriptMockDataPluginConfig {
        return this.rawConfig;
    }

    /**
     * Gets scalar generator configuration for a given scalar type.
     *
     * @param scalarName - The name of the GraphQL scalar type
     * @returns Configuration for generating mock values for this scalar, or undefined if not configured
     */
    getScalarConfig(scalarName: string): ScalarGeneratorConfig | undefined {
        return this.rawConfig.scalars?.[scalarName];
    }

    /**
     * Checks if a scalar type has custom configuration.
     *
     * @param scalarName - The name of the GraphQL scalar type
     * @returns True if custom configuration exists for this scalar
     */
    hasScalarConfig(scalarName: string): boolean {
        return Boolean(this.rawConfig.scalars?.[scalarName]);
    }

    /**
     * Gets all configured scalar type names.
     *
     * @returns Array of scalar type names that have custom configuration
     */
    getConfiguredScalarNames(): string[] {
        return Object.keys(this.rawConfig.scalars || {});
    }

    /**
     * Validates the plugin configuration.
     *
     * @returns Validation result with any errors found
     */
    validate(): ValidationResult {
        const errors: string[] = [];

        // Validate scalar configurations
        if (this.rawConfig.scalars) {
            for (const [scalarName, config] of Object.entries(
                this.rawConfig.scalars,
            )) {
                if (!scalarName || typeof scalarName !== "string") {
                    errors.push("Scalar name must be a non-empty string");
                    continue;
                }

                if (typeof config === "string") {
                    // String configs are valid (casual.js generator names)
                    continue;
                }

                if (typeof config === "object" && config !== null) {
                    if (
                        !config.generator ||
                        typeof config.generator !== "string"
                    ) {
                        errors.push(
                            `Scalar "${scalarName}" must have a generator string`,
                        );
                    }
                } else {
                    errors.push(
                        `Invalid configuration for scalar "${scalarName}"`,
                    );
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}

/**
 * Result of configuration validation.
 */
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}
