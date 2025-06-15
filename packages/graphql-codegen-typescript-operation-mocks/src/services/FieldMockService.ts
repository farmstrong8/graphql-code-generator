import type {
    GraphQLType,
    GraphQLObjectType,
    GraphQLInterfaceType,
    GraphQLCompositeType,
    FieldNode,
    FragmentDefinitionNode,
    SelectionSetNode,
    GraphQLNamedType,
} from "graphql";
import {
    isScalarType,
    isObjectType,
    isInterfaceType,
    isUnionType,
    isListType,
    isNonNullType,
    getNamedType,
} from "graphql";
import type { ScalarHandler } from "../handlers/ScalarHandler";
import type { MockDataVariants } from "../types";

/**
 * Options for field mock generation.
 */
export interface FieldMockOptions {
    /** Function to build nested object mocks */
    nestedObjectBuilder?: (
        parentType: GraphQLCompositeType,
        selectionSet: SelectionSetNode,
        operationName: string,
        fragmentRegistry: Map<string, FragmentDefinitionNode>,
    ) => MockDataVariants;
    /** Whether to wrap values in arrays for list types */
    wrapInArray?: boolean;
}

/**
 * Service responsible for generating mock values for individual GraphQL fields.
 *
 * This service handles:
 * - Scalar field value generation
 * - Nested object field handling
 * - List type wrapping
 * - Type validation and analysis
 */
export class FieldMockService {
    constructor(private readonly scalarHandler: ScalarHandler) {}

    /**
     * Generates a mock value for a specific GraphQL field.
     *
     * @param parentType - The parent GraphQL type containing this field
     * @param fieldSelection - The field selection node
     * @param operationName - Base name for nested operations
     * @param fragmentRegistry - Available fragments
     * @param options - Field mock generation options
     * @returns The generated mock value for the field
     */
    generateFieldValue(
        parentType: GraphQLObjectType | GraphQLInterfaceType,
        fieldSelection: FieldNode,
        operationName: string,
        fragmentRegistry: Map<string, FragmentDefinitionNode>,
        options: FieldMockOptions = {},
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
                // Delegate to nested object builder if provided
                if (options.nestedObjectBuilder) {
                    const nestedMocks = options.nestedObjectBuilder(
                        namedType,
                        fieldSelection.selectionSet,
                        operationName,
                        fragmentRegistry,
                    );

                    // Return the first mock's value (for single objects)
                    return Array.isArray(nestedMocks) && nestedMocks.length > 0
                        ? nestedMocks[0]?.mockValue || null
                        : null;
                }

                // Fallback: return a basic object with __typename
                return {
                    __typename: namedType.name,
                };
            }

            return null;
        };

        const value = getValue();
        return isList && options.wrapInArray !== false ? [value] : value;
    }

    /**
     * Recursively checks if a GraphQL type (with potential wrappers) is a list type.
     * This handles NonNull wrappers around List types, e.g., [Todo!]! -> true
     *
     * @param graphqlType - The GraphQL type to check
     * @returns True if the type is a list type after unwrapping wrappers
     */
    isListTypeRecursive(graphqlType: GraphQLType): boolean {
        // Handle non-null wrappers - unwrap and check the inner type
        if (isNonNullType(graphqlType)) {
            return this.isListTypeRecursive(graphqlType.ofType);
        }

        // Check if this is actually a list type
        return isListType(graphqlType);
    }

    /**
     * Analyzes a GraphQL field to determine its characteristics.
     *
     * @param parentType - The parent type containing the field
     * @param fieldName - The name of the field to analyze
     * @returns Field analysis information
     */
    analyzeField(
        parentType: GraphQLObjectType | GraphQLInterfaceType,
        fieldName: string,
    ): FieldAnalysis {
        const fieldDef = parentType.getFields()[fieldName];

        if (!fieldDef) {
            return {
                exists: false,
                type: null,
                namedType: null,
                isList: false,
                isScalar: false,
                isObject: false,
                isUnion: false,
                isNullable: true,
            };
        }

        const fieldType = fieldDef.type;
        const namedType = getNamedType(fieldType);
        const isNullable = !isNonNullType(fieldType);

        return {
            exists: true,
            type: fieldType,
            namedType,
            isList: this.isListTypeRecursive(fieldType),
            isScalar: isScalarType(namedType),
            isObject: isObjectType(namedType) || isInterfaceType(namedType),
            isUnion: isUnionType(namedType),
            isNullable,
        };
    }

    /**
     * Validates if a field selection is valid for the given parent type.
     *
     * @param parentType - The parent type to validate against
     * @param fieldSelection - The field selection to validate
     * @returns True if the field selection is valid
     */
    validateFieldSelection(
        parentType: GraphQLObjectType | GraphQLInterfaceType,
        fieldSelection: FieldNode,
    ): boolean {
        const fieldName = fieldSelection.name.value;
        const fieldDef = parentType.getFields()[fieldName];

        return fieldDef !== undefined;
    }
}

/**
 * Result of field analysis.
 */
export interface FieldAnalysis {
    /** Whether the field exists on the parent type */
    exists: boolean;
    /** The raw GraphQL field type (with wrappers) */
    type: GraphQLType | null;
    /** The named GraphQL type (unwrapped) */
    namedType: GraphQLNamedType | null;
    /** Whether this is a list type */
    isList: boolean;
    /** Whether the named type is a scalar */
    isScalar: boolean;
    /** Whether the named type is an object or interface */
    isObject: boolean;
    /** Whether the named type is a union */
    isUnion: boolean;
    /** Whether the field is nullable */
    isNullable: boolean;
}
