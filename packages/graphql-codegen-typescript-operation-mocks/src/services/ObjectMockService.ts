import type {
    GraphQLObjectType,
    GraphQLInterfaceType,
    GraphQLField,
    GraphQLType,
    FieldNode,
    GraphQLNamedType,
    SelectionNode,
} from "graphql";
import { isListType, isNonNullType, getNamedType, Kind } from "graphql";

/**
 * Micro-service responsible for building mock objects from GraphQL field definitions.
 *
 * This service handles the core logic of converting GraphQL field selections
 * into mock data objects with appropriate values.
 */
export class ObjectMockService {
    /**
     * Builds a mock object from field selections.
     *
     * @param fields - Array of GraphQL field selections
     * @param parentType - The parent GraphQL type
     * @param options - Options for mock generation
     * @returns Mock object with field values
     */
    buildMockObject(
        fields: FieldNode[],
        parentType: GraphQLObjectType | GraphQLInterfaceType,
        options: ObjectMockOptions = {},
    ): Record<string, unknown> {
        const mockObject: Record<string, unknown> = {};

        for (const field of fields) {
            const fieldName = field.name.value;
            const fieldDef = parentType.getFields()[fieldName];

            if (!fieldDef) {
                continue;
            }

            mockObject[fieldName] = this.generateFieldValue(
                field,
                fieldDef,
                options,
            );
        }

        return mockObject;
    }

    /**
     * Generates a mock value for a specific GraphQL field.
     *
     * @param fieldSelection - The field selection from the query
     * @param fieldDef - The GraphQL field definition from schema
     * @param options - Options for value generation
     * @returns Mock value for the field
     */
    generateFieldValue(
        fieldSelection: FieldNode,
        fieldDef: GraphQLField<any, any>,
        options: ObjectMockOptions = {},
    ): unknown {
        const fieldType = fieldDef.type;
        const namedType = getNamedType(fieldType);

        // Handle scalar fields
        if (options.scalarValueGenerator) {
            const scalarValue = options.scalarValueGenerator(
                namedType.name,
                fieldSelection,
            );
            if (scalarValue !== undefined) {
                return this.wrapValueForType(scalarValue, fieldType);
            }
        }

        // Handle nested object fields
        if (fieldSelection.selectionSet && options.nestedObjectBuilder) {
            const nestedValue = options.nestedObjectBuilder(
                fieldSelection,
                namedType,
            );
            if (nestedValue !== undefined) {
                return this.wrapValueForType(nestedValue, fieldType);
            }
        }

        // Fallback to default values
        return this.getDefaultValueForType(fieldType);
    }

    /**
     * Wraps a value according to GraphQL type modifiers (NonNull, List).
     *
     * @param value - Base value to wrap
     * @param graphqlType - GraphQL type with modifiers
     * @returns Value wrapped according to type
     */
    private wrapValueForType(
        value: unknown,
        graphqlType: GraphQLType,
    ): unknown {
        if (isNonNullType(graphqlType)) {
            return this.wrapValueForType(value, graphqlType.ofType);
        }

        if (isListType(graphqlType)) {
            // For lists, wrap the value in an array
            const wrappedElement = this.wrapValueForType(
                value,
                graphqlType.ofType,
            );
            return [wrappedElement];
        }

        return value;
    }

    /**
     * Gets a default value for a GraphQL type.
     *
     * @param graphqlType - GraphQL type to get default for
     * @returns Default value for the type
     */
    private getDefaultValueForType(graphqlType: GraphQLType): unknown {
        if (isNonNullType(graphqlType)) {
            return this.getDefaultValueForType(graphqlType.ofType);
        }

        if (isListType(graphqlType)) {
            const elementDefault = this.getDefaultValueForType(
                graphqlType.ofType,
            );
            return [elementDefault];
        }

        const namedType = getNamedType(graphqlType);

        // Basic defaults for common scalar types
        switch (namedType.name) {
            case "String":
            case "ID":
                return "default-string";
            case "Int":
                return 0;
            case "Float":
                return 0.0;
            case "Boolean":
                return false;
            default:
                return null;
        }
    }

    /**
     * Checks if a GraphQL type is a list type (including nested lists).
     *
     * @param graphqlType - Type to check
     * @returns True if type is or contains a list
     */
    isListTypeRecursive(graphqlType: GraphQLType): boolean {
        if (isListType(graphqlType)) {
            return true;
        }

        if (isNonNullType(graphqlType)) {
            return this.isListTypeRecursive(graphqlType.ofType);
        }

        return false;
    }

    /**
     * Extracts field selections from a selection set.
     *
     * @param selections - GraphQL selections
     * @returns Array of field selections only
     */
    extractFieldSelections(selections: readonly SelectionNode[]): FieldNode[] {
        return selections.filter(
            (selection) => selection.kind === Kind.FIELD,
        ) as FieldNode[];
    }
}

/**
 * Options for configuring object mock generation.
 */
export interface ObjectMockOptions {
    /** Function to generate scalar values */
    scalarValueGenerator?: (typeName: string, field: FieldNode) => unknown;
    /** Function to build nested objects */
    nestedObjectBuilder?: (field: FieldNode, type: GraphQLNamedType) => unknown;
    /** Whether to generate minimal objects */
    minimal?: boolean;
}
