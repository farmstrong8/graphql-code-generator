import type { GraphQLSchema, FragmentDefinitionNode } from "graphql";
import { Kind } from "graphql";
import type { Types } from "@graphql-codegen/plugin-helpers";
import type { CodeArtifactCollection } from "../types";
import type { TypeScriptMockDataPluginConfig } from "../config/types";
import { PluginConfig } from "../config/PluginConfig";
import { ServiceContainer } from "./ServiceContainer";

/**
 * Main orchestrator for the GraphQL TypeScript Mock Data Plugin.
 *
 * This class coordinates the entire plugin workflow by:
 * 1. Managing the service container and dependency injection
 * 2. Orchestrating document processing across multiple GraphQL files
 * 3. Coordinating fragment resolution and cross-document dependencies
 * 4. Combining all generated artifacts into the final plugin output
 *
 * The orchestrator follows the Command pattern, providing a single entry point
 * for the plugin while delegating specific responsibilities to specialized services.
 */
export class PluginOrchestrator {
    private readonly config: PluginConfig;
    private readonly serviceContainer: ServiceContainer;

    constructor(
        private readonly schema: GraphQLSchema,
        rawConfig: TypeScriptMockDataPluginConfig,
    ) {
        this.config = new PluginConfig(rawConfig);
        this.serviceContainer = new ServiceContainer(this.schema, this.config);
    }

    /**
     * Orchestrates the generation of mock artifacts from GraphQL documents.
     *
     * This is the main entry point for the plugin, coordinating:
     * - Global fragment registry building
     * - Document processing delegation
     * - Artifact collection and combination
     *
     * @param documents - Array of GraphQL documents to process
     * @returns Complete TypeScript code string with mock builders
     */
    generateFromDocuments(documents: Types.DocumentFile[]): string {
        const allArtifacts: CodeArtifactCollection = [];

        // Build a global fragment registry from all documents first
        // This enables cross-document fragment resolution
        const globalFragmentRegistry =
            this.buildGlobalFragmentRegistry(documents);

        // Process each document using the configured processor
        for (const document of documents) {
            if (!document.document) continue;

            const documentProcessor =
                this.serviceContainer.createDocumentProcessor();
            const documentArtifacts = documentProcessor.processDocument(
                document.document,
                globalFragmentRegistry,
            );
            allArtifacts.push(...documentArtifacts);
        }

        return this.combineArtifacts(allArtifacts);
    }

    /**
     * Combines all generated code artifacts into a single TypeScript output.
     *
     * This method handles:
     * - Boilerplate injection (once at the top)
     * - Artifact deduplication and ordering
     * - Final code formatting and structure
     *
     * @param artifacts - Array of generated code artifacts
     * @returns Complete TypeScript code with all mocks
     */
    private combineArtifacts(artifacts: CodeArtifactCollection): string {
        if (artifacts.length === 0) {
            return "";
        }

        // Extract and clean code from each artifact
        const mockDefinitions: string[] = [];

        for (const artifact of artifacts) {
            if (artifact.generatedCode.trim()) {
                mockDefinitions.push(artifact.generatedCode.trim());
            }
        }

        // Return empty if no valid definitions
        if (mockDefinitions.length === 0) {
            return "";
        }

        // Get boilerplate from service and combine with mock definitions
        const boilerplate = this.serviceContainer
            .getBoilerplateService()
            .generateStandardBoilerplate();
        return [boilerplate, "", ...mockDefinitions].join("\n\n");
    }

    /**
     * Builds a global fragment registry from all documents.
     *
     * This enables fragments defined in one file to be used in queries
     * defined in other files, supporting the near-operation-file preset.
     *
     * @param documents - Array of GraphQL documents
     * @returns Map of fragment name to fragment definition
     */
    private buildGlobalFragmentRegistry(
        documents: Types.DocumentFile[],
    ): Map<string, FragmentDefinitionNode> {
        const globalRegistry = new Map<string, FragmentDefinitionNode>();

        for (const document of documents) {
            if (!document.document) continue;

            // Extract fragments from this document
            const fragments = document.document.definitions.filter(
                (def): def is FragmentDefinitionNode =>
                    def.kind === Kind.FRAGMENT_DEFINITION,
            );

            // Add fragments to global registry
            for (const fragment of fragments) {
                globalRegistry.set(fragment.name.value, fragment);
            }
        }

        return globalRegistry;
    }

    /**
     * Gets the configured plugin configuration.
     *
     * @returns PluginConfig instance
     */
    getConfig(): PluginConfig {
        return this.config;
    }

    /**
     * Gets the service container for advanced usage.
     *
     * @returns ServiceContainer instance
     */
    getServiceContainer(): ServiceContainer {
        return this.serviceContainer;
    }
}
