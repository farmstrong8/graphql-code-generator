import type {
    MockDataObject,
    MockDataVariants,
    GeneratedCodeArtifact,
} from "../types";
import { MOCK_BUILDER_BOILERPLATE } from "../utils/codeTemplates";
import type {
    TypeInferenceService,
    SemanticTypeInfo,
} from "../services/TypeInferenceService";
import type {
    NestedTypeCollector,
    NestedTypeInfo,
} from "../services/NestedTypeCollector";
import { TypeDefinitionGenerator } from "./TypeDefinitionGenerator";
import { BuilderFunctionGenerator } from "./BuilderFunctionGenerator";
import {
    SemanticTypeProcessor,
    type SchemaGenerationContext,
} from "./SemanticTypeProcessor";
import { NestedTypeHandler } from "./NestedTypeHandler";

// Re-export for backward compatibility
export type { SchemaGenerationContext };

/**
 * TypeScript Code Builder
 *
 * A sophisticated builder that generates TypeScript code from mock data objects.
 * This class leverages specialized utility classes to handle different aspects of code generation:
 *
 * - **TypeDefinitionGenerator**: Handles generation of TypeScript type definitions
 * - **BuilderFunctionGenerator**: Manages creation of builder functions for testing
 * - **SemanticTypeProcessor**: Processes GraphQL schema-based semantic types
 * - **NestedTypeHandler**: Handles complex nested type operations
 *
 * The class supports both simple mock data conversion and advanced GraphQL schema-aware
 * code generation with proper handling of unions, fragments, and nested types.
 *
 * @example Basic Usage
 * ```typescript
 * const builder = new TypeScriptCodeBuilder(typeInferenceService, nestedTypeCollector);
 * const artifact = builder.generateCode({
 *   mockName: 'queryUser',
 *   mockValue: { id: '1', name: 'John' }
 * });
 * ```
 *
 * @example Advanced Usage with Schema Context
 * ```typescript
 * const artifact = builder.buildCodeArtifact(
 *   'GetUser',
 *   'query',
 *   mockDataVariants,
 *   {
 *     parentType: userType,
 *     selectionSet: selectionSet,
 *     fragmentRegistry: fragments
 *   }
 * );
 * ```
 */
export class TypeScriptCodeBuilder {
    /**
     * Utility for generating TypeScript type definitions from mock data.
     */
    private readonly typeDefinitionGenerator = new TypeDefinitionGenerator();

    /**
     * Utility for generating TypeScript builder functions for testing.
     */
    private readonly builderFunctionGenerator = new BuilderFunctionGenerator();

    /**
     * Utility for processing GraphQL schema-based semantic types.
     */
    private readonly semanticTypeProcessor = new SemanticTypeProcessor(
        this.typeInferenceService,
    );

    /**
     * Utility for handling complex nested type operations.
     */
    private readonly nestedTypeHandler = new NestedTypeHandler();

    /**
     * Creates a new TypeScript Code Builder instance.
     *
     * @param typeInferenceService - Service for analyzing GraphQL types and generating TypeScript
     * @param nestedTypeCollector - Service for collecting and organizing nested type information
     */
    constructor(
        private readonly typeInferenceService: TypeInferenceService,
        private readonly nestedTypeCollector: NestedTypeCollector,
    ) {}
    /**
     * Generates a complete code artifact from multiple mock data objects.
     *
     * This is the primary method for generating TypeScript code when working with
     * GraphQL operations. It handles:
     *
     * - Collection and processing of nested types
     * - Generation of specialized builders for nested objects
     * - Schema-aware type generation using GraphQL context
     * - Proper handling of unions, fragments, and complex type relationships
     *
     * @param operationName - Name of the GraphQL operation (e.g., 'GetUser', 'UpdateTodo')
     * @param operationType - Type of GraphQL operation ('query', 'mutation', 'subscription', 'fragment')
     * @param mockDataObjects - Array of mock data variants to generate code from
     * @param schemaContext - Optional GraphQL schema context for semantic type generation
     * @returns Complete code artifact containing all generated TypeScript code
     *
     * @example
     * ```typescript
     * const artifact = builder.buildCodeArtifact(
     *   'GetUserProfile',
     *   'query',
     *   [
     *     { mockName: 'getUserProfile', mockValue: { user: { id: '1', profile: {...} } } },
     *     { mockName: 'getUserProfileAsEmpty', mockValue: { user: null } }
     *   ],
     *   {
     *     parentType: QueryType,
     *     selectionSet: userProfileSelectionSet,
     *     fragmentRegistry: new Map()
     *   }
     * );
     * ```
     */
    buildCodeArtifact(
        operationName: string,
        operationType: "query" | "mutation" | "subscription" | "fragment",
        mockDataObjects: MockDataVariants,
        schemaContext?: SchemaGenerationContext,
    ): GeneratedCodeArtifact {
        // Start with the imports and boilerplate
        const codeBlocks: string[] = [MOCK_BUILDER_BOILERPLATE];

        // Collect nested types that should have their own builders
        const nestedTypes: Map<string, any> = new Map();
        if (schemaContext) {
            const nestedTypeInfos =
                this.nestedTypeCollector.collectFromSelectionSet({
                    parentType: schemaContext.parentType,
                    selectionSet: schemaContext.selectionSet,
                    operationName,
                    fragmentRegistry: schemaContext.fragmentRegistry,
                });

            // Generate builders for nested types first
            for (const nestedTypeInfo of nestedTypeInfos) {
                const nestedBuilderName =
                    this.nestedTypeHandler.generateNestedBuilderName(
                        operationName,
                        nestedTypeInfo.typeName,
                    );
                const nestedMockValue =
                    this.nestedTypeHandler.extractNestedMockValue(
                        mockDataObjects,
                        nestedTypeInfo,
                    );

                if (nestedMockValue) {
                    const nestedTypeDefinition =
                        this.typeDefinitionGenerator.generateNestedTypeDefinition(
                            nestedBuilderName,
                            nestedTypeInfo,
                            operationName,
                            this.typeInferenceService,
                        );
                    const nestedBuilderFunction =
                        this.builderFunctionGenerator.generateNestedBuilderFunction(
                            nestedBuilderName,
                            nestedMockValue,
                            nestedTypeInfo.typeName,
                        );

                    codeBlocks.push("");
                    codeBlocks.push(nestedTypeDefinition);
                    codeBlocks.push("");
                    codeBlocks.push(nestedBuilderFunction);

                    // Store for reference replacement in main builders
                    nestedTypes.set(nestedTypeInfo.typeName, nestedBuilderName);
                }
            }
        }

        // Add each mock data object
        for (const mockData of mockDataObjects) {
            const schemaTypeBody = schemaContext
                ? this.semanticTypeProcessor.generateSemanticTypeBodyWithNestedTypes(
                      schemaContext,
                      nestedTypes,
                      mockData.mockValue,
                  )
                : undefined;

            const typeDefinition =
                this.typeDefinitionGenerator.generateTypeDefinition(
                    mockData.mockName,
                    mockData.mockValue,
                    schemaTypeBody,
                    operationName,
                    operationType,
                );
            const builderFunction =
                this.builderFunctionGenerator.generateBuilderFunction(
                    mockData.mockName,
                    mockData.mockValue,
                    operationName,
                    operationType,
                    nestedTypes,
                );

            codeBlocks.push("");
            codeBlocks.push(typeDefinition);
            codeBlocks.push("");
            codeBlocks.push(builderFunction);
        }

        return {
            operationName,
            operationType,
            generatedCode: codeBlocks.join("\n"),
        };
    }

    /**
     * Generates TypeScript code from a single mock data object.
     *
     * This method provides a simpler interface for generating code from individual
     * mock objects without GraphQL schema context. It automatically infers the
     * operation type from the mock name and generates appropriate TypeScript types
     * and builder functions.
     *
     * @param mockData - The mock data object containing name and value
     * @returns Generated code artifact with TypeScript definitions and builders
     *
     * @example
     * ```typescript
     * const artifact = builder.generateCode({
     *   mockName: 'queryUserList',
     *   mockValue: {
     *     users: [
     *       { id: '1', name: 'Alice', email: 'alice@example.com' },
     *       { id: '2', name: 'Bob', email: 'bob@example.com' }
     *     ]
     *   }
     * });
     *
     * // Generates:
     * // type QueryUserList = { users: Array<{ id: string, name: string, email: string }> }
     * // export const aQueryUserList = createBuilder<QueryUserList>({ users: [...] });
     * ```
     */
    generateCode(mockData: MockDataObject): GeneratedCodeArtifact {
        const { mockName, mockValue } = mockData;
        const operationType = this.inferOperationType(mockName);

        // Generate the type definition
        const typeDefinition =
            this.typeDefinitionGenerator.generateTypeDefinition(
                mockName,
                mockValue,
                undefined,
                undefined,
                operationType,
            );

        // Generate the builder function
        const builderFunction =
            this.builderFunctionGenerator.generateBuilderFunction(
                mockName,
                mockValue,
                undefined,
                operationType,
            );

        // Combine all parts
        const generatedCode = [
            MOCK_BUILDER_BOILERPLATE,
            "",
            typeDefinition,
            "",
            builderFunction,
        ].join("\n");

        return {
            operationName: mockName,
            operationType,
            generatedCode,
        };
    }

    /**
     * Infers the operation type from the mock name based on naming conventions.
     *
     * @param mockName - The name of the mock data object
     * @returns Inferred operation type (query, mutation, subscription, or fragment)
     */
    private inferOperationType(
        mockName: string,
    ): "query" | "mutation" | "subscription" | "fragment" {
        // Simple inference based on name prefix
        if (mockName.startsWith("query")) {
            return "query";
        } else if (mockName.startsWith("mutation")) {
            return "mutation";
        } else if (mockName.startsWith("subscription")) {
            return "subscription";
        } else {
            return "fragment";
        }
    }
}
