import type {
    GraphQLSchema,
    GraphQLCompositeType,
    GraphQLObjectType,
    GraphQLInterfaceType,
    GraphQLUnionType,
    SelectionSetNode,
    FieldNode,
    FragmentDefinitionNode,
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
} from "graphql";
import type { MockDataObject, MockDataVariants } from "../types";
import type { ScalarHandler } from "../handlers/ScalarHandler";
import type { SelectionSetHandler } from "../handlers/SelectionSetHandler";
import type { UnionHandler } from "../handlers/UnionHandler";

/**
 * Parameters for building mock objects from GraphQL types.
 */
export interface BuildMockObjectParams {
    parentType: GraphQLObjectType | GraphQLInterfaceType;
    selectionSet: SelectionSetNode;
    operationName: string;
    fragmentRegistry: Map<string, FragmentDefinitionNode>;
}

/**
 * Builds JavaScript mock objects from GraphQL selection sets.
 *
 * This builder is responsible for creating mock data objects that match
 * the structure defined by GraphQL selection sets, handling all GraphQL
 * type variants including scalars, objects, lists, and unions.
 */
export class MockObjectBuilder {
    private unionHandler?: UnionHandler;

    constructor(
        private readonly schema: GraphQLSchema,
        private readonly scalarHandler: ScalarHandler,
        private readonly selectionSetHandler: SelectionSetHandler,
    ) {}

    /**
     * Sets the union handler dependency (resolves circular dependency).
     *
     * @param handler - The UnionHandler instance
     */
    setUnionHandler(handler: UnionHandler): void {
        this.unionHandler = handler;
        handler.setMockObjectBuilder(this);
    }

    /**
     * Builds mock data objects for a GraphQL composite type.
     *
     * @param parentType - The GraphQL object/interface/union type
     * @param selectionSet - The selection set to mock
     * @param operationName - Name hint for the generated mock
     * @param fragmentRegistry - Available fragments
     * @returns Array of mock data objects
     */
    buildForType(
        parentType: GraphQLCompositeType,
        selectionSet: SelectionSetNode,
        operationName: string,
        fragmentRegistry: Map<string, FragmentDefinitionNode>,
    ): MockDataVariants {
        if (isUnionType(parentType)) {
            if (!this.unionHandler) {
                throw new Error("UnionHandler not set on MockObjectBuilder");
            }
            return this.unionHandler.processUnionType({
                unionType: parentType,
                selectionSet,
                operationName,
                fragmentRegistry,
            });
        }

        return this.buildObjectMock({
            parentType: parentType as GraphQLObjectType | GraphQLInterfaceType,
            selectionSet,
            operationName,
            fragmentRegistry,
        });
    }

    /**
     * Builds a mock object for an object or interface type.
     *
     * @param params - Building parameters
     * @returns Array containing the mock data object
     */
    private buildObjectMock(params: BuildMockObjectParams): MockDataVariants {
        const { parentType, selectionSet, operationName, fragmentRegistry } =
            params;

        // Resolve the selection set with fragments
        const resolvedSelectionSet =
            this.selectionSetHandler.resolveSelectionSet(
                selectionSet,
                fragmentRegistry,
            );

        // Check if any fields return union types - if so, we need to generate variants
        const unionFields = this.findUnionFields(
            parentType,
            resolvedSelectionSet,
        );

        if (unionFields.length > 0) {
            return this.buildObjectMockWithUnionVariants({
                parentType,
                selectionSet: resolvedSelectionSet,
                operationName,
                fragmentRegistry,
                unionFields,
            });
        }

        // Standard object mock generation
        return this.buildSingleObjectMock({
            parentType,
            selectionSet: resolvedSelectionSet,
            operationName,
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
        fragmentRegistry: Map<string, FragmentDefinitionNode>;
        unionFields: FieldNode[];
    }): MockDataVariants {
        const {
            parentType,
            selectionSet,
            operationName,
            fragmentRegistry,
            unionFields,
        } = params;
        const allVariants: MockDataVariants = [];

        // For each union field, generate variants
        for (const unionField of unionFields) {
            const fieldDef = parentType.getFields()[unionField.name.value];
            const unionType = getNamedType(fieldDef.type) as GraphQLUnionType;

            // Generate union variants for this field
            const unionVariants = this.unionHandler!.processUnionType({
                unionType,
                selectionSet: unionField.selectionSet!,
                operationName,
                fragmentRegistry,
            });

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
        fragmentRegistry: Map<string, FragmentDefinitionNode>;
    }): MockDataVariants {
        const { parentType, selectionSet, operationName, fragmentRegistry } =
            params;

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
     * Generates a mock value for a specific field.
     *
     * @param parentType - The parent GraphQL type containing this field
     * @param fieldSelection - The field selection node
     * @param operationName - Base name for nested operations
     * @param fragmentRegistry - Available fragments
     * @returns The generated mock value for the field
     */
    private generateFieldValue(
        parentType: GraphQLObjectType | GraphQLInterfaceType,
        fieldSelection: FieldNode,
        operationName: string,
        fragmentRegistry: Map<string, FragmentDefinitionNode>,
    ): unknown {
        const fieldName = fieldSelection.name.value;
        const fieldDef = parentType.getFields()[fieldName];

        if (!fieldDef) {
            return undefined;
        }

        const fieldType = fieldDef.type;
        const namedType = getNamedType(fieldType);
        const isList = this.isListTypeRecursive(fieldType);

        const getValue = (): unknown => {
            if (isScalarType(namedType)) {
                return this.scalarHandler.generateMockValue(namedType.name);
            }

            if (
                (isObjectType(namedType) ||
                    isInterfaceType(namedType) ||
                    isUnionType(namedType)) &&
                fieldSelection.selectionSet
            ) {
                const nestedMocks = this.buildForType(
                    namedType,
                    fieldSelection.selectionSet,
                    operationName,
                    fragmentRegistry,
                );

                // Return the first mock's value (for single objects)
                return nestedMocks[0]?.mockValue || null;
            }

            return null;
        };

        const value = getValue();
        return isList ? [value] : value;
    }

    /**
     * Recursively checks if a GraphQL type (with potential wrappers) is a list type.
     * This handles NonNull wrappers around List types, e.g., [Todo!]! -> true
     *
     * @param graphqlType - The GraphQL type to check
     * @returns True if the type is a list type after unwrapping wrappers
     */
    private isListTypeRecursive(graphqlType: any): boolean {
        // Handle non-null wrappers - unwrap and check the inner type
        if (isNonNullType(graphqlType)) {
            return this.isListTypeRecursive(graphqlType.ofType);
        }

        // Check if this is actually a list type
        return isListType(graphqlType);
    }
}
