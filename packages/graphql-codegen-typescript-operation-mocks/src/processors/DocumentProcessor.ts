import type {
    GraphQLSchema,
    DocumentNode,
    OperationDefinitionNode,
    FragmentDefinitionNode,
    GraphQLObjectType,
    GraphQLInterfaceType,
    GraphQLUnionType,
    GraphQLCompositeType,
} from "graphql";
import { Kind, isCompositeType } from "graphql";
import type { GeneratedCodeArtifact, CodeArtifactCollection } from "../types";
import type { MockObjectBuilder } from "../builders/MockObjectBuilder";
import type { TypeScriptCodeBuilder } from "../builders/TypeScriptCodeBuilder";

/**
 * Processes GraphQL documents and converts them into code artifacts.
 *
 * This processor handles the orchestration of converting GraphQL operations
 * and fragments into mock data by coordinating between the mock object builder
 * and TypeScript code builder.
 */
export class DocumentProcessor {
    constructor(
        private readonly schema: GraphQLSchema,
        private readonly mockObjectBuilder: MockObjectBuilder,
        private readonly codeBuilder: TypeScriptCodeBuilder,
    ) {}

    /**
     * Processes a complete GraphQL document into code artifacts.
     *
     * @param document - The GraphQL document to process
     * @param globalFragmentRegistry - Registry of all available fragments from all documents
     * @returns Array of generated code artifacts for each operation/fragment
     */
    processDocument(
        document: DocumentNode,
        globalFragmentRegistry?: Map<string, FragmentDefinitionNode>,
    ): CodeArtifactCollection {
        const artifacts: CodeArtifactCollection = [];

        // Always merge global and local fragments to ensure all fragments are available
        const localFragments = this.extractFragments(document);
        const fragmentRegistry = new Map<string, FragmentDefinitionNode>();

        // First, add global fragments if provided
        if (globalFragmentRegistry) {
            for (const [name, fragment] of globalFragmentRegistry) {
                fragmentRegistry.set(name, fragment);
            }
        }

        // Then, add local fragments (this will override global ones if there are conflicts)
        for (const fragment of localFragments) {
            fragmentRegistry.set(fragment.name.value, fragment);
        }

        // Process fragments first to ensure they're available for operations
        for (const definition of document.definitions) {
            if (definition.kind === Kind.FRAGMENT_DEFINITION) {
                const artifact = this.processFragment(
                    definition,
                    fragmentRegistry,
                );
                if (artifact) {
                    artifacts.push(artifact);
                }
            }
        }

        // Then process operations that may use those fragments
        for (const definition of document.definitions) {
            if (definition.kind === Kind.OPERATION_DEFINITION) {
                const artifact = this.processOperation(
                    definition,
                    fragmentRegistry,
                );
                if (artifact) {
                    artifacts.push(artifact);
                }
            }
        }

        return artifacts;
    }

    /**
     * Processes a GraphQL operation (query, mutation, subscription).
     *
     * @param operation - The operation definition
     * @param fragmentRegistry - Available fragment definitions
     * @returns Generated code artifact for the operation, or null if processing fails
     */
    private processOperation(
        operation: OperationDefinitionNode,
        fragmentRegistry: Map<string, FragmentDefinitionNode>,
    ): GeneratedCodeArtifact | null {
        if (!operation.name) {
            return null;
        }

        const operationName = operation.name.value;
        const operationType = operation.operation;

        // Get the root type for this operation
        const rootType = this.getRootTypeForOperation(operationType);
        if (!rootType) {
            return null;
        }

        // Build mock data objects
        const mockDataObjects = this.mockObjectBuilder.buildForType(
            rootType,
            operation.selectionSet,
            operationName,
            fragmentRegistry,
            operationType,
        );

        // Generate TypeScript code
        return this.codeBuilder.buildCodeArtifact(
            operationName,
            operationType,
            {
                parentType: rootType,
                selectionSet: operation.selectionSet,
                fragmentRegistry,
            },
        );
    }

    /**
     * Processes a GraphQL fragment definition.
     *
     * @param fragment - The fragment definition
     * @param fragmentRegistry - Available fragment definitions
     * @returns Generated code artifact for the fragment, or null if processing fails
     */
    private processFragment(
        fragment: FragmentDefinitionNode,
        fragmentRegistry: Map<string, FragmentDefinitionNode>,
    ): GeneratedCodeArtifact | null {
        const fragmentName = fragment.name.value;
        const typeName = fragment.typeCondition.name.value;

        // Get the target type for the fragment
        const targetType = this.schema.getType(typeName);
        if (!targetType || !isCompositeType(targetType)) {
            return null;
        }

        // Build mock data objects
        const mockDataObjects = this.mockObjectBuilder.buildForType(
            targetType,
            fragment.selectionSet,
            fragmentName,
            fragmentRegistry,
            "fragment",
        );

        // Generate TypeScript code
        return this.codeBuilder.buildCodeArtifact(fragmentName, "fragment", {
            parentType: targetType as GraphQLObjectType | GraphQLInterfaceType,
            selectionSet: fragment.selectionSet,
            fragmentRegistry,
        });
    }

    /**
     * Extracts all fragment definitions from a document.
     *
     * @param document - The GraphQL document
     * @returns Array of fragment definitions
     */
    private extractFragments(document: DocumentNode): FragmentDefinitionNode[] {
        return document.definitions.filter(
            (def): def is FragmentDefinitionNode =>
                def.kind === Kind.FRAGMENT_DEFINITION,
        );
    }

    /**
     * Gets the root type for a given operation type.
     *
     * @param operationType - The operation type (query, mutation, subscription)
     * @returns The root GraphQL type, or null/undefined if not found
     */
    private getRootTypeForOperation(
        operationType: string,
    ): GraphQLObjectType | null | undefined {
        switch (operationType) {
            case "query":
                return this.schema.getQueryType();
            case "mutation":
                return this.schema.getMutationType();
            case "subscription":
                return this.schema.getSubscriptionType();
            default:
                return undefined;
        }
    }
}
