import { PluginConfig } from "../config/PluginConfig";
import { ScalarMockService } from "../services/ScalarMockService";
import casual from "casual";

/**
 * Handles the generation of mock values for GraphQL scalar types.
 *
 * This handler acts as a bridge between the plugin configuration system
 * and the ScalarMockService, providing a clean interface for scalar mock generation.
 */
export class ScalarHandler {
    private readonly scalarMockService = new ScalarMockService();

    constructor(private readonly config: PluginConfig) {}

    /**
     * Generates a mock value for the specified scalar type.
     *
     * @param scalarName - The name of the scalar type
     * @param context - Optional context for deterministic generation (e.g., builder name)
     * @returns A mock value appropriate for the scalar type
     */
    generateMockValue(scalarName: string, context?: string): unknown {
        return this.scalarMockService.generateMockValue(
            scalarName,
            this.config.getRawConfig(),
            context,
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
        return this.scalarMockService.generateEnumValue(enumValues);
    }

    /**
     * Validates if a given key is a valid casual.js generator.
     *
     * @param key - The casual.js generator key to validate
     * @returns True if the key is valid, false otherwise
     */
    static isValidCasualKey(key: string): boolean {
        return key in casual;
    }
}
