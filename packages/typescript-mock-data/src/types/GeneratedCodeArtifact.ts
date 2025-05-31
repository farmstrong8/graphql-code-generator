/**
 * Represents a complete generated code artifact for a GraphQL operation or fragment.
 * This contains the final TypeScript code that will be written to a file.
 */
export type GeneratedCodeArtifact = {
    /** The name of the GraphQL operation or fragment */
    operationName: string;
    /** The type of GraphQL definition */
    operationType: "query" | "mutation" | "subscription" | "fragment";
    /** The complete TypeScript code including types and builder functions */
    generatedCode: string;
};

/**
 * Collection of generated code artifacts from processing a GraphQL document.
 */
export type CodeArtifactCollection = GeneratedCodeArtifact[];
