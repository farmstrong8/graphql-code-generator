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
    GraphQLSchema,
} from "graphql";
import { isObjectType, isInterfaceType } from "graphql";
import {
    SchemaFirstCodeService,
    type SchemaCodeArtifact,
} from "../services/SchemaFirstCodeService";
import type { ScalarHandler } from "../handlers/ScalarHandler";

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
    private readonly schemaFirstCodeService: SchemaFirstCodeService;
    private readonly typeDefinitionService = new TypeDefinitionService();
    private readonly builderCodeService = new BuilderCodeService();
    private readonly boilerplateService = new BoilerplateService();

    constructor(
        private readonly typeInferenceService: TypeInferenceService,
        private readonly nestedTypeService: NestedTypeService,
        private readonly namingService: NamingService,
        private readonly scalarHandler: ScalarHandler,
        private readonly schema: GraphQLSchema,
    ) {
        // Initialize the schema-first service for cascading architecture
        this.schemaFirstCodeService = new SchemaFirstCodeService(
            schema,
            scalarHandler,
            namingService,
        );
    }

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
     * @param schemaContext - GraphQL schema context for semantic type generation (REQUIRED)
     * @returns Complete code artifact containing all generated TypeScript code
     *
     * @example
     * ```typescript
     * const artifact = builder.buildCodeArtifact(
     *   'GetUserProfile',
     *   'query',
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
        schemaContext: SchemaGenerationContext, // Made required - no more optional
    ): GeneratedCodeArtifact {
        // SCHEMA-FIRST ONLY: Use schema as single source of truth
        return this.buildFromSchemaContext(
            operationName,
            operationType,
            schemaContext,
        );
    }

    /**
     * Schema-first approach - everything cascades from schema analysis
     */
    private buildFromSchemaContext(
        operationName: string,
        operationType: "query" | "mutation" | "subscription" | "fragment",
        schemaContext: SchemaGenerationContext,
    ): GeneratedCodeArtifact {
        const { parentType, selectionSet, fragmentRegistry } = schemaContext;

        // Generate complete code artifact using schema-first service
        const artifact = this.schemaFirstCodeService.generateFromSchema({
            parentType,
            selectionSet,
            operationName,
            operationType,
            fragmentRegistry,
        });

        // Combine code WITHOUT duplicate boilerplate (boilerplate handled by orchestrator)
        const allCode = this.combineSchemaArtifacts(artifact);

        return {
            operationName,
            operationType,
            generatedCode: allCode,
        };
    }

    /**
     * Combines schema artifacts into final code (no boilerplate - handled by orchestrator)
     */
    private combineSchemaArtifacts(artifact: SchemaCodeArtifact): string {
        const parts: string[] = [];

        // Add nested artifacts first (dependencies)
        for (const nested of artifact.nestedArtifacts) {
            parts.push(nested.typeDefinition);
            parts.push("");
            parts.push(nested.builderCode);
            parts.push("");
        }

        // Add main artifact only if it has content (skip for union-only cases)
        if (artifact.typeDefinition.trim() && artifact.builderCode.trim()) {
            parts.push(artifact.typeDefinition);
            parts.push("");
            parts.push(artifact.builderCode);
        }

        return parts.join("\n").trim();
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
