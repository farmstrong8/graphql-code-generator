import type { PluginFunction } from "@graphql-codegen/plugin-helpers";
import { PluginOrchestrator } from "./orchestrators/PluginOrchestrator";
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
    const orchestrator = new PluginOrchestrator(schema, config);
    return orchestrator.generateFromDocuments(documents);
};
