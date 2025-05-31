import type { GraphQLSchema } from "graphql";
import { PluginConfig } from "../config/PluginConfig";
import { generateScalarMock } from "../utils/scalars";

/**
 * Handles the generation of mock values for GraphQL scalar types.
 *
 * This handler manages both primitive GraphQL scalars (String, Int, Float, Boolean, ID)
 * and custom scalars defined in the plugin configuration.
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
        return generateScalarMock(scalarName, this.config.getRawConfig());
    }
}
