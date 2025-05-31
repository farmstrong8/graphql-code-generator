import type { PluginFunction } from "@graphql-codegen/plugin-helpers";
import { MockDataGenerator } from "./core/MockDataGenerator";
import type { TypeScriptMockDataPluginConfig } from "./config/types";

/**
 * GraphQL Code Generator plugin for generating TypeScript mock data.
 *
 * This plugin processes GraphQL documents and generates mock builders
 * that can be used for testing and development purposes.
 */
export const plugin: PluginFunction<TypeScriptMockDataPluginConfig> = (
    schema,
    documents,
    config,
): string => {
    const generator = new MockDataGenerator(schema, config);
    return generator.generateFromDocuments(documents);
};
