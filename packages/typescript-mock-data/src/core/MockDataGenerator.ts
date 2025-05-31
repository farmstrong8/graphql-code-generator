import type { GraphQLSchema } from "graphql";
import type { Types } from "@graphql-codegen/plugin-helpers";
import type { CodeArtifactCollection } from "../types";
import { PluginConfig } from "../config/PluginConfig";
import { ArtifactFactory } from "./ArtifactFactory";
import { MOCK_BUILDER_BOILERPLATE } from "../utils/codeTemplates";

/**
 * Main orchestrator for generating mock data from GraphQL documents.
 *
 * This class coordinates the entire mock generation process by:
 * 1. Creating appropriate processors for each document type
 * 2. Delegating processing to specialized handlers
 * 3. Combining all generated artifacts into the final output
 */
export class MockDataGenerator {
    private readonly config: PluginConfig;
    private readonly artifactFactory: ArtifactFactory;

    constructor(
        private readonly schema: GraphQLSchema,
        rawConfig: any,
    ) {
        this.config = new PluginConfig(rawConfig);
        this.artifactFactory = new ArtifactFactory(this.schema, this.config);
    }

    /**
     * Generates mock artifacts from a collection of GraphQL documents.
     *
     * @param documents - Array of GraphQL documents to process
     * @returns Complete TypeScript code string with mock builders
     */
    generateFromDocuments(documents: Types.DocumentFile[]): string {
        const allArtifacts: CodeArtifactCollection = [];

        for (const document of documents) {
            if (!document.document) continue;

            const documentProcessor =
                this.artifactFactory.createDocumentProcessor();
            const documentArtifacts = documentProcessor.processDocument(
                document.document,
            );
            allArtifacts.push(...documentArtifacts);
        }

        return this.combineArtifacts(allArtifacts);
    }

    /**
     * Combines all code artifacts into a single TypeScript code string.
     *
     * @param artifacts - Array of generated code artifacts
     * @returns Complete TypeScript code with all mocks
     */
    private combineArtifacts(artifacts: CodeArtifactCollection): string {
        if (artifacts.length === 0) {
            return "";
        }

        // Extract the mock definitions (without boilerplate) from each artifact
        const mockDefinitions: string[] = [];

        for (const artifact of artifacts) {
            const codeWithoutBoilerplate = this.removeMockBuilderBoilerplate(
                artifact.generatedCode,
            );
            if (codeWithoutBoilerplate.trim()) {
                mockDefinitions.push(codeWithoutBoilerplate.trim());
            }
        }

        // Combine boilerplate once at the top with all mock definitions
        if (mockDefinitions.length === 0) {
            return "";
        }

        return [MOCK_BUILDER_BOILERPLATE, "", ...mockDefinitions].join("\n\n");
    }

    /**
     * Removes the mock builder boilerplate from generated code.
     *
     * @param code - Generated code that may contain boilerplate
     * @returns Code with boilerplate removed
     */
    private removeMockBuilderBoilerplate(code: string): string {
        // Remove the boilerplate by finding where it ends
        const boilerplateEndMarker =
            "function createBuilder<T extends object>(base: T) {\n  return (overrides?: DeepPartial<T>): T => merge({}, base, overrides);\n}";

        const endIndex = code.indexOf(boilerplateEndMarker);
        if (endIndex === -1) {
            // If boilerplate not found, return the code as-is (might be already clean)
            return code;
        }

        // Find the end of the boilerplate and return everything after it
        const afterBoilerplate = code.substring(
            endIndex + boilerplateEndMarker.length,
        );
        return afterBoilerplate.replace(/^\s*\n+/, ""); // Remove leading whitespace and newlines
    }
}
