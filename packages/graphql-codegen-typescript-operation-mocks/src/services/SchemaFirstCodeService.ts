import type {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLInterfaceType,
    GraphQLUnionType,
    SelectionSetNode,
    FieldNode,
    FragmentDefinitionNode,
} from "graphql";
import { isObjectType, Kind, getNamedType, isUnionType } from "graphql";
import type { ScalarHandler } from "../handlers/ScalarHandler";
import type { NamingService } from "./NamingService";
import { TypeInferenceService } from "./TypeInferenceService";
import { BuilderCodeService } from "./BuilderCodeService";
import { SchemaAnalysisService } from "./SchemaAnalysisService";
import { ValueGenerationService } from "./ValueGenerationService";
import type { MockDataVariants } from "../types";
import { SelectionSetHandler } from "../handlers/SelectionSetHandler";

/**
 * Complete code artifact generated from schema analysis
 */
export interface SchemaCodeArtifact {
    /** TypeScript type definition */
    typeDefinition: string;
    /** Complete mock value with all fields */
    mockValue: Record<string, unknown>;
    /** Builder function code */
    builderCode: string;
    /** Nested artifacts that need to be generated first */
    nestedArtifacts: SchemaCodeArtifact[];
}

/**
 * Parameters for schema-first code generation
 */
export interface SchemaFirstParams {
    parentType: GraphQLObjectType | GraphQLInterfaceType;
    selectionSet: SelectionSetNode;
    operationName: string;
    operationType: "query" | "mutation" | "subscription" | "fragment";
    fragmentRegistry: Map<string, FragmentDefinitionNode>;
    depth?: number;
}

/**
 * Schema-First Code Service
 *
 * This is an ORCHESTRATOR that composes atomic services to generate consistent
 * code from GraphQL schema analysis. It follows the single responsibility principle
 * by delegating ALL specific tasks to specialized services.
 *
 * Atomic Services Used:
 * - SchemaAnalysisService: Schema structure analysis
 * - ValueGenerationService: Mock value generation
 * - TypeInferenceService: TypeScript type generation
 * - BuilderCodeService: Builder function generation
 * - NamingService: Consistent naming conventions
 *
 * Key Principles:
 * - Single Responsibility: ONLY orchestrates, implements nothing
 * - Easily Testable: All logic is in atomic services that can be mocked
 * - Composable: Pure composition of existing services
 * - Predictable: Same inputs always produce same outputs
 */
export class SchemaFirstCodeService {
    private readonly maxDepth = 5;
    private readonly schemaAnalysisService: SchemaAnalysisService;
    private readonly valueGenerationService: ValueGenerationService;
    private readonly typeInferenceService: TypeInferenceService;
    private readonly builderCodeService = new BuilderCodeService();
    private readonly selectionSetHandler: SelectionSetHandler;

    constructor(
        private readonly schema: GraphQLSchema,
        private readonly scalarHandler: ScalarHandler,
        private readonly namingService: NamingService,
    ) {
        // Compose atomic services
        this.schemaAnalysisService = new SchemaAnalysisService(schema);
        this.valueGenerationService = new ValueGenerationService(
            scalarHandler,
            this.schemaAnalysisService,
        );
        this.typeInferenceService = new TypeInferenceService(schema);
        this.selectionSetHandler = new SelectionSetHandler(schema);
    }

    /**
     * Orchestrates code generation using atomic services.
     * This method ONLY coordinates - it implements NO business logic.
     */
    generateFromSchema(params: SchemaFirstParams): SchemaCodeArtifact {
        const { parentType, selectionSet, operationName, operationType } =
            params;

        // 0. Resolve fragments once at the beginning
        const resolvedSelectionSet =
            this.selectionSetHandler.resolveSelectionSet(
                selectionSet,
                params.fragmentRegistry,
            );

        // Check if this selection set contains union fields
        const unionFields = this.findUnionFields(
            parentType,
            resolvedSelectionSet,
        );

        if (unionFields.length > 0) {
            // Generate union variants and main builder
            return this.generateWithUnionVariants(
                {
                    ...params,
                    selectionSet: resolvedSelectionSet,
                },
                unionFields,
            );
        }

        // Use NamingService for consistent naming
        const typeName = this.namingService.generateTypeName(
            operationName,
            operationType,
        );
        const builderName = this.namingService.generateBuilderName(
            operationName,
            operationType,
        );

        // 1. Analyze nested types first (using resolved selection set)
        const nestedArtifacts = this.analyzeNestedTypes({
            ...params,
            selectionSet: resolvedSelectionSet,
        });

        // 2. Build nested builder map
        const nestedBuilderMap = this.buildNestedBuilderMap(nestedArtifacts);

        // 3. Use TypeInferenceService for type generation (using resolved selection set)
        const semanticTypeInfo = this.typeInferenceService.analyzeGraphQLType(
            parentType,
            resolvedSelectionSet,
            params.fragmentRegistry,
        );
        const typeDefinition = `type ${typeName} = ${this.typeInferenceService.generateTypeString(semanticTypeInfo)};`;

        // 4. Use ValueGenerationService for mock value generation (using resolved selection set)
        const mockValue = this.valueGenerationService.generateMockObject(
            parentType,
            resolvedSelectionSet,
            params.fragmentRegistry,
            { nestedBuilders: nestedBuilderMap },
        );

        // 5. Use BuilderCodeService for builder generation
        const builderCode = this.builderCodeService.generateBuilderFunction(
            builderName,
            typeName,
            mockValue,
            { nestedBuilders: nestedBuilderMap },
        );

        return {
            typeDefinition,
            mockValue,
            builderCode,
            nestedArtifacts,
        };
    }

    /**
     * Generates union variants using the nested builder pattern.
     * For each inline fragment, creates both:
     * 1. The inner object builder (e.g., aTodoDetailsPageQueryAsTodoTodo)
     * 2. The query wrapper builder that references it (e.g., aTodoDetailsPageQueryAsTodo)
     */
    generateUnionVariants(
        unionType: GraphQLUnionType,
        selectionSet: SelectionSetNode,
        operationName: string,
        operationType: "query" | "mutation" | "subscription" | "fragment",
        fragmentRegistry: Map<string, FragmentDefinitionNode>,
        parentType: GraphQLObjectType | GraphQLInterfaceType,
        unionFieldName: string,
    ): SchemaCodeArtifact[] {
        const variants: SchemaCodeArtifact[] = [];

        for (const selection of selectionSet.selections) {
            if (
                selection.kind === Kind.INLINE_FRAGMENT &&
                selection.typeCondition
            ) {
                const targetTypeName = selection.typeCondition.name.value;
                const targetType = this.schema.getType(targetTypeName);

                if (targetType && isObjectType(targetType)) {
                    // Generate proper variant names following the nested builder pattern
                    const operationNameWithSuffix =
                        this.namingService.generateTypeName(
                            operationName,
                            operationType,
                        );

                    // Inner object builder (e.g., TodoDetailsPageQueryAsTodoTodo)
                    const innerTypeName = `${operationNameWithSuffix}As${targetTypeName}${targetTypeName}`;
                    const innerBuilderName = `a${innerTypeName}`;

                    // Query wrapper builder (e.g., TodoDetailsPageQueryAsTodo)
                    const wrapperTypeName = `${operationNameWithSuffix}As${targetTypeName}`;
                    const wrapperBuilderName = `a${wrapperTypeName}`;

                    // Generate the inner object type and builder
                    const innerSemanticInfo =
                        this.typeInferenceService.analyzeGraphQLType(
                            targetType,
                            selection.selectionSet,
                            fragmentRegistry,
                        );
                    const innerTypeDefinition = `type ${innerTypeName} = ${this.typeInferenceService.generateTypeString(innerSemanticInfo)};`;

                    const innerMockValue =
                        this.valueGenerationService.generateMockObject(
                            targetType,
                            selection.selectionSet,
                            fragmentRegistry,
                        );

                    const innerBuilderCode =
                        this.builderCodeService.generateBuilderFunction(
                            innerBuilderName,
                            innerTypeName,
                            innerMockValue,
                        );

                    // Generate the query wrapper type and builder
                    const wrapperMockValue: Record<string, unknown> = {
                        __typename: parentType.name,
                        [unionFieldName]: innerMockValue,
                    };

                    // Create wrapper type definition
                    const wrapperTypeDefinition = `type ${wrapperTypeName} = {\n    __typename: "${parentType.name}";\n    ${unionFieldName}: ${innerTypeName};\n};`;

                    // Create nested builder map for the wrapper
                    const nestedBuilderMap = new Map<string, string>();
                    nestedBuilderMap.set(targetTypeName, innerBuilderName);

                    const wrapperBuilderCode =
                        this.builderCodeService.generateBuilderFunction(
                            wrapperBuilderName,
                            wrapperTypeName,
                            wrapperMockValue,
                            { nestedBuilders: nestedBuilderMap },
                        );

                    // Add inner builder first (dependency)
                    variants.push({
                        typeDefinition: innerTypeDefinition,
                        mockValue: innerMockValue,
                        builderCode: innerBuilderCode,
                        nestedArtifacts: [],
                    });

                    // Then add wrapper builder
                    variants.push({
                        typeDefinition: wrapperTypeDefinition,
                        mockValue: wrapperMockValue,
                        builderCode: wrapperBuilderCode,
                        nestedArtifacts: [],
                    });
                }
            }
        }

        return variants;
    }

    /**
     * Simple coordination of nested type analysis using SchemaAnalysisService
     */
    private analyzeNestedTypes(
        params: SchemaFirstParams,
    ): SchemaCodeArtifact[] {
        const artifacts: SchemaCodeArtifact[] = [];
        this.collectNestedArtifacts(params, artifacts, "", 0);
        return artifacts;
    }

    /**
     * Simple recursive collection using atomic services
     */
    private collectNestedArtifacts(
        params: SchemaFirstParams,
        artifacts: SchemaCodeArtifact[],
        path: string,
        depth: number,
    ): void {
        if (depth >= this.maxDepth) return;

        const {
            parentType,
            selectionSet,
            operationName,
            operationType,
            fragmentRegistry,
        } = params;

        // Use SchemaAnalysisService to analyze this selection set
        const analysis = this.schemaAnalysisService.analyzeSelectionSet(
            parentType,
            selectionSet,
            fragmentRegistry,
        );

        // Process nested object fields
        for (const fieldInfo of analysis.nestedObjectFields) {
            if (fieldInfo.nestedType && fieldInfo.selection.selectionSet) {
                const fieldPath = path
                    ? `${path}.${fieldInfo.name}`
                    : fieldInfo.name;

                // Use NamingService for nested names
                const nestedTypeName = this.generateNestedTypeName(
                    operationName,
                    fieldPath,
                );
                const nestedBuilderName = this.generateNestedBuilderName(
                    operationName,
                    fieldPath,
                );

                // Resolve fragments for nested selection set
                const resolvedNestedSelectionSet =
                    this.selectionSetHandler.resolveSelectionSet(
                        fieldInfo.selection.selectionSet,
                        fragmentRegistry,
                    );

                // Use TypeInferenceService for nested type
                const nestedSemanticInfo =
                    this.typeInferenceService.analyzeGraphQLType(
                        fieldInfo.nestedType,
                        resolvedNestedSelectionSet,
                        fragmentRegistry,
                    );
                const nestedTypeDefinition = `type ${nestedTypeName} = ${this.typeInferenceService.generateTypeString(nestedSemanticInfo)};`;

                // First, recursively collect deeper nested artifacts
                const deeperArtifacts: SchemaCodeArtifact[] = [];
                this.collectNestedArtifacts(
                    {
                        ...params,
                        parentType: fieldInfo.nestedType,
                        selectionSet: resolvedNestedSelectionSet,
                    },
                    deeperArtifacts,
                    fieldPath,
                    depth + 1,
                );

                // Build nested builder map for this level
                const nestedBuilderMap =
                    this.buildNestedBuilderMap(deeperArtifacts);

                // Use ValueGenerationService for nested mock
                const nestedMockValue =
                    this.valueGenerationService.generateMockObject(
                        fieldInfo.nestedType,
                        resolvedNestedSelectionSet,
                        fragmentRegistry,
                    );

                // Use BuilderCodeService for nested builder with nested builders map
                const nestedBuilderCode =
                    this.builderCodeService.generateBuilderFunction(
                        nestedBuilderName,
                        nestedTypeName,
                        nestedMockValue,
                        { nestedBuilders: nestedBuilderMap },
                    );

                // Add deeper artifacts first (dependencies)
                artifacts.push(...deeperArtifacts);

                // Then add the current artifact
                artifacts.push({
                    typeDefinition: nestedTypeDefinition,
                    mockValue: nestedMockValue,
                    builderCode: nestedBuilderCode,
                    nestedArtifacts: deeperArtifacts,
                });
            }
        }
    }

    /**
     * Simple mapping function - easily testable
     */
    private buildNestedBuilderMap(
        artifacts: SchemaCodeArtifact[],
    ): Map<string, string> {
        const map = new Map<string, string>();

        for (const artifact of artifacts) {
            const typename = artifact.mockValue.__typename as string;
            if (typename) {
                const builderName = this.extractBuilderName(
                    artifact.builderCode,
                );
                if (builderName) {
                    map.set(typename, builderName);
                }
            }
        }

        return map;
    }

    // Simple helper methods - pure functions, easily testable
    private generateNestedTypeName(
        operationName: string,
        path: string,
    ): string {
        const pathParts = path
            .split(".")
            .map((p) => p.charAt(0).toUpperCase() + p.slice(1));
        return `${operationName}${pathParts.join("")}`;
    }

    private generateNestedBuilderName(
        operationName: string,
        path: string,
    ): string {
        return `a${this.generateNestedTypeName(operationName, path)}`;
    }

    private extractBuilderName(builderCode: string): string {
        const match = builderCode.match(/export const (\w+) =/);
        return match ? match[1] : "";
    }

    private findUnionFields(
        parentType: GraphQLObjectType | GraphQLInterfaceType,
        selectionSet: SelectionSetNode,
    ): FieldNode[] {
        const unionFields: FieldNode[] = [];

        for (const selection of selectionSet.selections) {
            if (selection.kind === Kind.FIELD) {
                const fieldName = selection.name.value;
                const fieldDef = parentType.getFields()[fieldName];

                if (fieldDef && selection.selectionSet) {
                    const fieldType = getNamedType(fieldDef.type);
                    if (isUnionType(fieldType)) {
                        unionFields.push(selection);
                    }
                }
            }
        }

        return unionFields;
    }

    private generateWithUnionVariants(
        params: SchemaFirstParams,
        unionFields: FieldNode[],
    ): SchemaCodeArtifact {
        const {
            parentType,
            selectionSet,
            operationName,
            operationType,
            fragmentRegistry,
        } = params;
        const allVariants: SchemaCodeArtifact[] = [];

        // Generate variants for each union field
        for (const unionField of unionFields) {
            const fieldDef = parentType.getFields()[unionField.name.value];
            const unionType = getNamedType(fieldDef.type) as GraphQLUnionType;

            // Generate union variants for this specific field
            const fieldVariants = this.generateUnionVariants(
                unionType,
                unionField.selectionSet!,
                operationName,
                operationType,
                fragmentRegistry,
                parentType,
                unionField.name.value,
            );

            allVariants.push(...fieldVariants);
        }

        // DON'T generate a main builder - user should choose which variant they want
        // Return a synthetic artifact that only contains the variants
        return {
            typeDefinition: "", // No main type definition
            mockValue: {}, // No main mock value
            builderCode: "", // No main builder code
            nestedArtifacts: allVariants, // Only the variants
        };
    }
}
