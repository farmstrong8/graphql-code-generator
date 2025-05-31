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

        const mockValue: Record<string, unknown> = {
            __typename: parentType.name,
        };

        // Process each field in the selection set
        for (const selection of resolvedSelectionSet.selections) {
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
        const isList = isListType(fieldType);

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
}
