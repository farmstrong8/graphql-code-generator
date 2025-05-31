import type { GraphQLSchema } from "graphql";
import type { Types } from "@graphql-codegen/plugin-helpers";
import type { CodeArtifactCollection } from "../types";
import { PluginConfig } from "../config/PluginConfig";
import { ArtifactFactory } from "./ArtifactFactory";

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
        const codeBlocks = artifacts.map((artifact) => artifact.generatedCode);
        return codeBlocks.join("\n\n");
    }
}
