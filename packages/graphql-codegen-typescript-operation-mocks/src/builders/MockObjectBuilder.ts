import type {
    GraphQLSchema,
    GraphQLCompositeType,
    GraphQLObjectType,
    GraphQLInterfaceType,
    GraphQLUnionType,
    SelectionSetNode,
    FieldNode,
    FragmentDefinitionNode,
    InlineFragmentNode,
    GraphQLType,
} from "graphql";
import {
    isObjectType,
    isInterfaceType,
    isUnionType,
    isScalarType,
    isListType,
    isNonNullType,
    getNamedType,
    Kind,
    isCompositeType,
} from "graphql";
import type { MockDataObject, MockDataVariants } from "../types";
import type { ScalarHandler } from "../handlers/ScalarHandler";
import type { SelectionSetHandler } from "../handlers/SelectionSetHandler";
import type { UnionMockService } from "../services/UnionMockService";
import type { FieldMockService } from "../services/FieldMockService";

/**
 * Parameters for building mock objects from GraphQL types.
 */
export interface BuildMockObjectParams {
    parentType: GraphQLObjectType | GraphQLInterfaceType;
    selectionSet: SelectionSetNode;
    operationName: string;
    operationType?: "query" | "mutation" | "subscription" | "fragment";
    fragmentRegistry: Map<string, FragmentDefinitionNode>;
}

/**
 * Builds JavaScript mock objects from GraphQL selection sets.
 *
 * This builder coordinates between services to create mock data objects
 * that match the structure defined by GraphQL selection sets.
 */
export class MockObjectBuilder {
    constructor(
        private readonly schema: GraphQLSchema,
        private readonly scalarHandler: ScalarHandler,
        private readonly selectionSetHandler: SelectionSetHandler,
        private readonly unionMockService: UnionMockService,
        private readonly fieldMockService: FieldMockService,
    ) {}

    /**
     * Builds mock data objects for a GraphQL composite type.
     *
     * @param parentType - The GraphQL object/interface/union type
     * @param selectionSet - The selection set to mock
     * @param operationName - Name hint for the generated mock
     * @param fragmentRegistry - Available fragments
     * @param operationType - The operation type for proper naming
     * @returns Array of mock data objects
     */
    buildForType(
        parentType: GraphQLCompositeType,
        selectionSet: SelectionSetNode,
        operationName: string,
        fragmentRegistry: Map<string, FragmentDefinitionNode>,
        operationType?: "query" | "mutation" | "subscription" | "fragment",
    ): MockDataVariants {
        if (isUnionType(parentType)) {
            return this.processUnionType(
                parentType,
                selectionSet,
                operationName,
                fragmentRegistry,
                operationType,
            );
        }

        return this.buildObjectMock({
            parentType: parentType as GraphQLObjectType | GraphQLInterfaceType,
            selectionSet,
            operationName,
            operationType,
            fragmentRegistry,
        });
    }

    /**
     * Processes a union type using the UnionMockService.
     */
    private processUnionType(
        unionType: GraphQLUnionType,
        selectionSet: SelectionSetNode,
        operationName: string,
        fragmentRegistry: Map<string, FragmentDefinitionNode>,
        operationType?: "query" | "mutation" | "subscription" | "fragment",
    ): MockDataVariants {
        return this.unionMockService.processUnionType({
            unionType,
            selectionSet,
            operationName,
            operationType: operationType || "query", // Default to query if not provided
            fragmentRegistry,
            mockObjectBuilder: (
                targetType,
                inlineSelectionSet,
                variantName,
                fragmentReg,
            ) => {
                // Delegate back to this MockObjectBuilder to build complete mock objects
                return this.buildForType(
                    targetType,
                    inlineSelectionSet,
                    variantName,
                    fragmentReg,
                    operationType,
                );
            },
        });
    }

    /**
     * Builds a mock object for an object or interface type.
     */
    private buildObjectMock(params: BuildMockObjectParams): MockDataVariants {
        const {
            parentType,
            selectionSet,
            operationName,
            operationType,
            fragmentRegistry,
        } = params;

        // Resolve the selection set with fragments
        const resolvedSelectionSet =
            this.selectionSetHandler.resolveSelectionSet(
                selectionSet,
                fragmentRegistry,
            );

        // Check for union fields using the service
        const unionFields = this.unionMockService.findUnionFields(
            parentType,
            resolvedSelectionSet,
        );

        if (unionFields.length > 0) {
            return this.buildObjectMockWithUnionVariants({
                parentType,
                selectionSet: resolvedSelectionSet,
                operationName,
                operationType,
                fragmentRegistry,
                unionFields,
            });
        }

        return this.buildSingleObjectMock({
            parentType,
            selectionSet: resolvedSelectionSet,
            operationName,
            operationType,
            fragmentRegistry,
        });
    }

    /**
     * Finds fields in a selection set that return union types.
     */
    private findUnionFields(
        parentType: GraphQLObjectType | GraphQLInterfaceType,
        selectionSet: SelectionSetNode,
    ): FieldNode[] {
        const unionFields: FieldNode[] = [];

        for (const selection of selectionSet.selections) {
            if (selection.kind !== Kind.FIELD) continue;

            const fieldDef = parentType.getFields()[selection.name.value];
            if (!fieldDef) continue;

            const namedType = getNamedType(fieldDef.type);
            if (isUnionType(namedType) && selection.selectionSet) {
                unionFields.push(selection);
            }
        }

        return unionFields;
    }

    /**
     * Builds multiple mock variants when union fields are present.
     */
    private buildObjectMockWithUnionVariants(params: {
        parentType: GraphQLObjectType | GraphQLInterfaceType;
        selectionSet: SelectionSetNode;
        operationName: string;
        operationType?: "query" | "mutation" | "subscription" | "fragment";
        fragmentRegistry: Map<string, FragmentDefinitionNode>;
        unionFields: FieldNode[];
    }): MockDataVariants {
        const {
            parentType,
            selectionSet,
            operationName,
            operationType,
            fragmentRegistry,
            unionFields,
        } = params;
        const allVariants: MockDataVariants = [];

        // For each union field, generate variants
        for (const unionField of unionFields) {
            const fieldDef = parentType.getFields()[unionField.name.value];
            const unionType = getNamedType(fieldDef.type) as GraphQLUnionType;

            // Generate union variants for this field
            const unionVariants = this.processUnionType(
                unionType,
                unionField.selectionSet!,
                operationName,
                fragmentRegistry,
                operationType,
            );

            // Create a parent mock for each union variant
            for (const unionVariant of unionVariants) {
                const mockValue: Record<string, unknown> = {
                    __typename: parentType.name,
                };

                // Process all non-union fields normally
                for (const selection of selectionSet.selections) {
                    if (selection.kind !== Kind.FIELD) continue;

                    const fieldName = selection.name.value;

                    if (fieldName === unionField.name.value) {
                        // Use the union variant value for this field
                        mockValue[fieldName] = unionVariant.mockValue;
                    } else {
                        // Generate normal field value
                        const fieldValue = this.generateFieldValue(
                            parentType,
                            selection,
                            operationName,
                            fragmentRegistry,
                        );
                        if (fieldValue !== undefined) {
                            mockValue[fieldName] = fieldValue;
                        }
                    }
                }

                allVariants.push({
                    mockName: unionVariant.mockName,
                    mockValue,
                });
            }
        }

        return allVariants;
    }

    /**
     * Builds a single mock object (no union variants).
     */
    private buildSingleObjectMock(params: {
        parentType: GraphQLObjectType | GraphQLInterfaceType;
        selectionSet: SelectionSetNode;
        operationName: string;
        operationType?: "query" | "mutation" | "subscription" | "fragment";
        fragmentRegistry: Map<string, FragmentDefinitionNode>;
    }): MockDataVariants {
        const {
            parentType,
            selectionSet,
            operationName,
            operationType,
            fragmentRegistry,
        } = params;

        const mockValue: Record<string, unknown> = {
            __typename: parentType.name,
        };

        // Process each field in the selection set
        for (const selection of selectionSet.selections) {
            if (selection.kind !== Kind.FIELD) continue;

            const fieldValue = this.generateFieldValue(
                parentType,
                selection,
                operationName,
                fragmentRegistry,
            );

            if (fieldValue !== undefined) {
                mockValue[selection.name.value] = fieldValue;
            }
        }

        return [
            {
                mockName: operationName,
                mockValue,
            },
        ];
    }

    /**
     * Generates field values using the FieldMockService.
     */
    private generateFieldValue(
        parentType: GraphQLObjectType | GraphQLInterfaceType,
        fieldSelection: FieldNode,
        operationName: string,
        fragmentRegistry: Map<string, FragmentDefinitionNode>,
    ): unknown {
        return this.fieldMockService.generateFieldValue(
            parentType,
            fieldSelection,
            operationName,
            fragmentRegistry,
            {
                nestedObjectBuilder: (
                    nestedType,
                    nestedSelectionSet,
                    nestedOperationName,
                    nestedFragmentRegistry,
                ) => {
                    return this.buildForType(
                        nestedType,
                        nestedSelectionSet,
                        nestedOperationName,
                        nestedFragmentRegistry,
                    );
                },
            },
        );
    }

    /**
     * Recursively checks if a GraphQL type (with potential wrappers) is a list type.
     * This handles NonNull wrappers around List types, e.g., [Todo!]! -> true
     *
     * @param graphqlType - The GraphQL type to check
     * @returns True if the type is a list type after unwrapping wrappers
     */
    private isListTypeRecursive(graphqlType: GraphQLType): boolean {
        // Handle non-null wrappers - unwrap and check the inner type
        if (isNonNullType(graphqlType)) {
            return this.isListTypeRecursive(graphqlType.ofType);
        }

        // Check if this is actually a list type
        return isListType(graphqlType);
    }
}
