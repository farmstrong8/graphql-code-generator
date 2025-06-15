import type { GraphQLSchema, FragmentDefinitionNode } from "graphql";
import { Kind } from "graphql";
import type { Types } from "@graphql-codegen/plugin-helpers";
import type { CodeArtifactCollection } from "../types";
import type { TypeScriptMockDataPluginConfig } from "../config/types";
import { PluginConfig } from "../config/PluginConfig";
import { ServiceContainer } from "./ServiceContainer";
import { DocumentNode, SelectionSetNode } from "graphql";

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
     * Generates TypeScript mock code from GraphQL documents.
     *
     * @param documents - Array of GraphQL document files to process
     * @returns Combined TypeScript code string
     */
    generateFromDocuments(documents: Types.DocumentFile[]): string {
        // Build global fragment registry from all documents
        const globalFragmentRegistry =
            this.buildGlobalFragmentRegistry(documents);

        // Check if we have documents with fragment spreads
        const hasDocumentsWithFragmentSpreads = documents.some(
            (doc) =>
                doc.document && this.documentHasFragmentSpreads(doc.document),
        );

        // For near-operation-file preset: if we have fragment spreads but no fragments,
        // we should still generate mocks with synthetic fragment fields rather than skip
        // Only skip if this appears to be a duplicate pass with identical results
        if (
            hasDocumentsWithFragmentSpreads &&
            globalFragmentRegistry.size === 0 &&
            documents.length > 1 // Only skip for multi-document passes (global generation)
        ) {
            // Return empty string to skip this pass (likely a second pass with incomplete registry)
            return "";
        }

        const documentProcessor =
            this.serviceContainer.createDocumentProcessor();
        const allArtifacts: CodeArtifactCollection = [];

        // Process each document
        for (const document of documents) {
            if (!document.document) continue;

            const artifacts = documentProcessor.processDocument(
                document.document,
                globalFragmentRegistry,
            );

            allArtifacts.push(...artifacts);
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

    private documentHasFragmentSpreads(document: DocumentNode): boolean {
        // Check if any operation or fragment in the document uses fragment spreads
        for (const definition of document.definitions) {
            if (
                definition.kind === "OperationDefinition" ||
                definition.kind === "FragmentDefinition"
            ) {
                if (
                    this.selectionSetHasFragmentSpreads(definition.selectionSet)
                ) {
                    return true;
                }
            }
        }
        return false;
    }

    private selectionSetHasFragmentSpreads(
        selectionSet: SelectionSetNode,
    ): boolean {
        for (const selection of selectionSet.selections) {
            if (selection.kind === "FragmentSpread") {
                return true;
            }
            if (selection.kind === "Field" && selection.selectionSet) {
                if (
                    this.selectionSetHasFragmentSpreads(selection.selectionSet)
                ) {
                    return true;
                }
            }
            if (selection.kind === "InlineFragment" && selection.selectionSet) {
                if (
                    this.selectionSetHasFragmentSpreads(selection.selectionSet)
                ) {
                    return true;
                }
            }
        }
        return false;
    }
}
