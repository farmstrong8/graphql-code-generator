import type {
    MockDataObject,
    MockDataVariants,
    GeneratedCodeArtifact,
} from "../types";
import type {
    TypeInferenceService,
    SemanticTypeInfo,
} from "../services/TypeInferenceService";
import type {
    NestedTypeService,
    NestedTypeInfo,
} from "../services/NestedTypeService";
import { TypeDefinitionService } from "../services/TypeDefinitionService";
import { BuilderCodeService } from "../services/BuilderCodeService";
import { BoilerplateService } from "../services/BoilerplateService";
import type { NamingService } from "../services/NamingService";
import type {
    GraphQLObjectType,
    GraphQLInterfaceType,
    SelectionSetNode,
    FragmentDefinitionNode,
} from "graphql";

// Schema generation context interface
export interface SchemaGenerationContext {
    parentType: GraphQLObjectType | GraphQLInterfaceType;
    selectionSet: SelectionSetNode;
    fragmentRegistry: Map<string, FragmentDefinitionNode>;
}

/**
 * TypeScript Code Builder
 *
 * A sophisticated builder that generates TypeScript code from mock data objects.
 * This class leverages specialized service classes to handle different aspects of code generation:
 *
 * - **TypeDefinitionService**: Handles generation of TypeScript type definitions
 * - **BuilderCodeService**: Manages creation of builder functions for testing
 * - **TypeInferenceService**: Processes GraphQL schema-based semantic types
 * - **NestedTypeService**: Handles complex nested type operations
 * - **NamingService**: Manages consistent naming conventions
 *
 * The class supports both simple mock data conversion and advanced GraphQL schema-aware
 * code generation with proper handling of unions, fragments, and nested types.
 *
 * @example Basic Usage
 * ```typescript
 * const builder = new TypeScriptCodeBuilder(typeInferenceService, nestedTypeService, namingService);
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
     * Service for generating TypeScript type definitions from mock data.
     */
    private readonly typeDefinitionService = new TypeDefinitionService();

    /**
     * Service for generating TypeScript builder functions for testing.
     */
    private readonly builderCodeService = new BuilderCodeService();

    /**
     * Service for generating TypeScript boilerplate code.
     */
    private readonly boilerplateService = new BoilerplateService();

    /**
     * Creates a new TypeScript Code Builder instance.
     *
     * @param typeInferenceService - Service for analyzing GraphQL types and generating TypeScript
     * @param nestedTypeService - Service for collecting and organizing nested type information
     * @param namingService - Service for handling naming conventions and name generation
     */
    constructor(
        private readonly typeInferenceService: TypeInferenceService,
        private readonly nestedTypeService: NestedTypeService,
        private readonly namingService: NamingService,
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
        // Start with generated code blocks (boilerplate handled by orchestrator)
        const codeBlocks: string[] = [];

        // Collect nested types that should have their own builders
        const nestedTypes: Map<string, string> = new Map();
        if (schemaContext) {
            const nestedTypeInfos = this.nestedTypeService.analyzeSelectionSet({
                parentType: schemaContext.parentType,
                selectionSet: schemaContext.selectionSet,
                operationName,
                fragmentRegistry: schemaContext.fragmentRegistry,
            });

            // Generate builders for nested types first
            for (const nestedTypeInfo of nestedTypeInfos) {
                const nestedTypeName = this.nestedTypeService.generateTypeName(
                    operationName,
                    nestedTypeInfo.path,
                    nestedTypeInfo.typeName,
                );
                const nestedBuilderName =
                    this.nestedTypeService.generateBuilderName(
                        operationName,
                        nestedTypeInfo.path,
                        nestedTypeInfo.typeName,
                    );
                const nestedMockValue = this.nestedTypeService.extractMockValue(
                    mockDataObjects,
                    nestedTypeInfo,
                );

                if (nestedMockValue) {
                    // Use TypeInferenceService to generate semantic types for nested types
                    const nestedSemanticTypeInfo =
                        this.typeInferenceService.analyzeGraphQLType(
                            nestedTypeInfo.graphqlType,
                            nestedTypeInfo.selectionSet,
                            schemaContext.fragmentRegistry,
                        );
                    const nestedTypeString =
                        this.typeInferenceService.generateTypeString(
                            nestedSemanticTypeInfo,
                        );
                    const nestedTypeDefinition = `type ${nestedTypeName} = ${nestedTypeString};`;

                    const nestedBuilderFunction =
                        this.builderCodeService.generateBuilderFunction(
                            nestedBuilderName,
                            nestedTypeName,
                            nestedMockValue,
                            {
                                nestedBuilders: nestedTypes,
                            },
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
            // Generate proper type name with operation suffix
            const typeName = this.namingService.generateTypeName(
                mockData.mockName,
                operationType,
            );

            // Generate the type definition using schema context if available
            let typeDefinition: string;
            if (schemaContext) {
                // Use TypeInferenceService to generate semantic types from schema
                const semanticTypeInfo =
                    this.typeInferenceService.analyzeGraphQLType(
                        schemaContext.parentType,
                        schemaContext.selectionSet,
                        schemaContext.fragmentRegistry,
                    );
                const typeString =
                    this.typeInferenceService.generateTypeString(
                        semanticTypeInfo,
                    );
                typeDefinition = `type ${typeName} = ${typeString};`;
            } else {
                // Fallback to generating from mock value
                typeDefinition =
                    this.typeDefinitionService.generateNamedTypeDefinition(
                        typeName,
                        mockData.mockValue,
                    );
            }

            const builderFunction =
                this.builderCodeService.generateBuilderFunction(
                    this.namingService.generateBuilderName(
                        mockData.mockName,
                        operationType,
                    ),
                    typeName,
                    mockData.mockValue,
                    {
                        nestedBuilders: nestedTypes,
                    },
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
        const operationType = this.namingService.inferOperationType(mockName);

        // Generate proper type name with operation suffix
        const typeName = this.namingService.generateTypeName(
            mockName,
            operationType,
        );

        // Generate the type definition
        const typeDefinition =
            this.typeDefinitionService.generateNamedTypeDefinition(
                typeName,
                mockValue,
            );

        // Generate the builder function
        const builderFunction = this.builderCodeService.generateBuilderFunction(
            this.namingService.generateBuilderName(mockName, operationType),
            typeName,
            mockValue,
        );

        // Combine all parts (boilerplate handled by orchestrator)
        const generatedCode = [typeDefinition, "", builderFunction].join("\n");

        return {
            operationName: mockName,
            operationType,
            generatedCode,
        };
    }
}
