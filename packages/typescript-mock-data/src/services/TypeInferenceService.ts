import type {
    GraphQLSchema,
    GraphQLType,
    GraphQLObjectType,
    GraphQLInterfaceType,
    GraphQLUnionType,
    GraphQLScalarType,
    GraphQLFieldMap,
    FieldNode,
    SelectionSetNode,
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
} from "graphql";
import { isPrimitiveScalar } from "../utils/scalars";

/**
 * Represents semantic type information for TypeScript generation.
 */
export interface SemanticTypeInfo {
    /** The TypeScript type string (e.g., "string", "number", "boolean") */
    typeString: string;
    /** Whether this is an array type */
    isArray: boolean;
    /** Whether this type can be null */
    isNullable: boolean;
    /** For object types, the fields that should be included */
    objectFields?: Record<string, SemanticTypeInfo>;
}

/**
 * Parameters for type inference from GraphQL field information.
 */
export interface FieldTypeInferenceParams {
    parentType: GraphQLObjectType | GraphQLInterfaceType;
    fieldSelection: FieldNode;
    fragmentRegistry: Map<string, FragmentDefinitionNode>;
}

/**
 * Service responsible for inferring semantic TypeScript types from GraphQL schema information.
 *
 * This service bridges the gap between GraphQL schema types and TypeScript semantic types,
 * enabling the generation of proper types like "string" instead of literal types like '"uuid-value"'.
 */
export class TypeInferenceService {
    constructor(private readonly schema: GraphQLSchema) {}

    /**
     * Infers semantic type information for a GraphQL field.
     *
     * @param params - Field type inference parameters
     * @returns Semantic type information for TypeScript generation
     */
    inferFieldType(params: FieldTypeInferenceParams): SemanticTypeInfo {
        const { parentType, fieldSelection } = params;
        const fieldName = fieldSelection.name.value;
        const fieldDef = parentType.getFields()[fieldName];

        if (!fieldDef) {
            return this.createUnknownType();
        }

        return this.analyzeGraphQLType(
            fieldDef.type,
            fieldSelection.selectionSet,
            params.fragmentRegistry,
        );
    }

    /**
     * Analyzes a GraphQL type and returns semantic type information.
     *
     * @param graphqlType - The GraphQL type to analyze
     * @param selectionSet - Optional selection set for object types
     * @param fragmentRegistry - Available fragment definitions
     * @returns Semantic type information
     */
    analyzeGraphQLType(
        graphqlType: GraphQLType,
        selectionSet?: SelectionSetNode,
        fragmentRegistry?: Map<string, FragmentDefinitionNode>,
    ): SemanticTypeInfo {
        // Handle non-null wrappers
        if (isNonNullType(graphqlType)) {
            const innerType = this.analyzeGraphQLType(
                graphqlType.ofType,
                selectionSet,
                fragmentRegistry,
            );
            return {
                ...innerType,
                isNullable: false,
            };
        }

        // Handle list wrappers
        if (isListType(graphqlType)) {
            const elementType = this.analyzeGraphQLType(
                graphqlType.ofType,
                selectionSet,
                fragmentRegistry,
            );
            return {
                typeString: elementType.typeString,
                isArray: true,
                isNullable: true,
                objectFields: elementType.objectFields,
            };
        }

        const namedType = getNamedType(graphqlType);

        // Handle scalar types
        if (isScalarType(namedType)) {
            return this.inferScalarType(namedType);
        }

        // Handle object types
        if (isObjectType(namedType) || isInterfaceType(namedType)) {
            return this.inferObjectType(
                namedType,
                selectionSet,
                fragmentRegistry,
            );
        }

        // Handle union types
        if (isUnionType(namedType)) {
            return this.inferUnionType(namedType);
        }

        return this.createUnknownType();
    }

    /**
     * Infers semantic type for GraphQL scalar types.
     *
     * @param scalarType - The GraphQL scalar type
     * @returns Semantic type information for the scalar
     */
    private inferScalarType(scalarType: GraphQLScalarType): SemanticTypeInfo {
        const scalarName = scalarType.name;

        // Map primitive scalars to TypeScript types
        switch (scalarName) {
            case "String":
            case "ID":
                return {
                    typeString: "string",
                    isArray: false,
                    isNullable: true,
                };
            case "Int":
            case "Float":
                return {
                    typeString: "number",
                    isArray: false,
                    isNullable: true,
                };
            case "Boolean":
                return {
                    typeString: "boolean",
                    isArray: false,
                    isNullable: true,
                };
            default:
                // For custom scalars, we generally map them to their likely TypeScript equivalent
                // This could be enhanced with configuration in the future
                if (scalarName.toLowerCase().includes("date")) {
                    return {
                        typeString: "string",
                        isArray: false,
                        isNullable: true,
                    };
                }
                if (scalarName.toLowerCase().includes("json")) {
                    return {
                        typeString: "any",
                        isArray: false,
                        isNullable: true,
                    };
                }
                // Default custom scalars to string
                return {
                    typeString: "string",
                    isArray: false,
                    isNullable: true,
                };
        }
    }

    /**
     * Infers semantic type for GraphQL object types.
     *
     * @param objectType - The GraphQL object type
     * @param selectionSet - The selection set defining which fields are selected
     * @param fragmentRegistry - Available fragment definitions
     * @returns Semantic type information for the object
     */
    private inferObjectType(
        objectType: GraphQLObjectType | GraphQLInterfaceType,
        selectionSet?: SelectionSetNode,
        fragmentRegistry?: Map<string, FragmentDefinitionNode>,
    ): SemanticTypeInfo {
        if (!selectionSet) {
            // If no selection set, this field should be null
            return { typeString: "null", isArray: false, isNullable: true };
        }

        const objectFields: Record<string, SemanticTypeInfo> = {};
        const fields = objectType.getFields();

        // Process each selection in the selection set
        for (const selection of selectionSet.selections) {
            if (selection.kind === "Field") {
                const fieldName = selection.name.value;
                const fieldDef = fields[fieldName];

                if (fieldDef) {
                    objectFields[fieldName] = this.analyzeGraphQLType(
                        fieldDef.type,
                        selection.selectionSet,
                        fragmentRegistry,
                    );
                }
            }
            // TODO: Handle inline fragments and fragment spreads if needed
        }

        return {
            typeString: "object",
            isArray: false,
            isNullable: true,
            objectFields,
        };
    }

    /**
     * Infers semantic type for GraphQL union types.
     *
     * @param unionType - The GraphQL union type
     * @returns Semantic type information for the union
     */
    private inferUnionType(unionType: GraphQLUnionType): SemanticTypeInfo {
        // Union types are complex and handled separately by UnionHandler
        // For type generation purposes, we treat them as generic objects
        return {
            typeString: "object",
            isArray: false,
            isNullable: true,
        };
    }

    /**
     * Creates a semantic type representing an unknown/fallback type.
     *
     * @returns Semantic type information for unknown types
     */
    private createUnknownType(): SemanticTypeInfo {
        return {
            typeString: "unknown",
            isArray: false,
            isNullable: true,
        };
    }

    /**
     * Converts semantic type information to a TypeScript type string.
     *
     * @param typeInfo - The semantic type information
     * @returns TypeScript type string
     */
    generateTypeString(typeInfo: SemanticTypeInfo): string {
        let baseType = typeInfo.typeString;

        if (typeInfo.objectFields) {
            // Generate object type
            const properties: string[] = [];
            for (const [key, value] of Object.entries(typeInfo.objectFields)) {
                const keyStr = this.needsQuotes(key) ? `"${key}"` : key;
                const valueType = this.generateTypeString(value);
                properties.push(`${keyStr}: ${valueType}`);
            }
            baseType = `{\n  ${properties.join(",\n  ")}\n}`;
        }

        if (typeInfo.isArray) {
            baseType = `Array<${baseType}>`;
        }

        return baseType;
    }

    /**
     * Determines if a property key needs quotes in TypeScript.
     *
     * @param key - Property key to check
     * @returns True if quotes are needed
     */
    private needsQuotes(key: string): boolean {
        return !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) || key === "__typename";
    }
}
