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
} from "graphql";
import type { MockDataObject, MockDataVariants } from "../types";
import type { ScalarHandler } from "../handlers/ScalarHandler";
import type { SelectionSetHandler } from "../handlers/SelectionSetHandler";

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
    constructor(
        private readonly schema: GraphQLSchema,
        private readonly scalarHandler: ScalarHandler,
        private readonly selectionSetHandler: SelectionSetHandler,
    ) {}

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
            return this.processUnionType({
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
     * Processes a union type with inline fragments.
     *
     * @param params - Union processing parameters
     * @returns Mock data objects for each union variant
     */
    private processUnionType(params: {
        unionType: GraphQLUnionType;
        selectionSet: SelectionSetNode;
        operationName: string;
        fragmentRegistry: Map<string, FragmentDefinitionNode>;
    }): MockDataVariants {
        const { unionType, selectionSet, operationName, fragmentRegistry } =
            params;
        const variants: MockDataVariants = [];

        for (const selection of selectionSet.selections) {
            if (selection.kind !== Kind.INLINE_FRAGMENT) continue;

            const variant = this.processInlineFragment({
                inlineFragment: selection,
                unionType,
                operationName,
                fragmentRegistry,
            });

            if (variant) {
                variants.push(...variant);
            }
        }

        return variants;
    }

    /**
     * Processes an individual inline fragment within a union type.
     *
     * @param params - Inline fragment processing parameters
     * @returns Mock data objects for the fragment, or null if processing fails
     */
    private processInlineFragment(params: {
        inlineFragment: InlineFragmentNode;
        unionType: GraphQLUnionType;
        operationName: string;
        fragmentRegistry: Map<string, FragmentDefinitionNode>;
    }): MockDataVariants | null {
        const { inlineFragment, unionType, operationName, fragmentRegistry } =
            params;

        // Get the target type for this inline fragment
        if (!inlineFragment.typeCondition) {
            console.warn(
                `Inline fragment in union ${unionType.name} is missing type condition`,
            );
            return null;
        }

        const targetTypeName = inlineFragment.typeCondition.name.value;
        const targetType = this.schema.getType(targetTypeName);

        if (!targetType) {
            console.warn(
                `Type ${targetTypeName} not found in schema for union ${unionType.name}`,
            );
            return null;
        }

        // Verify the target type is a valid member of the union
        if (!unionType.getTypes().includes(targetType as any)) {
            console.warn(
                `Type ${targetTypeName} is not a valid member of union ${unionType.name}`,
            );
            return null;
        }

        // Generate a variant name that includes the union member type
        const variantName = `${operationName}As${targetTypeName}`;

        // Recursively build the mock for this variant
        return this.buildForType(
            targetType as GraphQLCompositeType,
            inlineFragment.selectionSet,
            variantName,
            fragmentRegistry,
        );
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
            const unionVariants = this.processUnionType({
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
    private isListTypeRecursive(graphqlType: GraphQLType): boolean {
        // Handle non-null wrappers - unwrap and check the inner type
        if (isNonNullType(graphqlType)) {
            return this.isListTypeRecursive(graphqlType.ofType);
        }

        // Check if this is actually a list type
        return isListType(graphqlType);
    }
}
