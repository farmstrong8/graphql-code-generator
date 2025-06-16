import type {
    GraphQLSchema,
    GraphQLType,
    GraphQLObjectType,
    GraphQLInterfaceType,
    GraphQLUnionType,
    GraphQLScalarType,
    GraphQLEnumType,
    FieldNode,
    SelectionSetNode,
    FragmentDefinitionNode,
} from "graphql";
import {
    isObjectType,
    isInterfaceType,
    isUnionType,
    isScalarType,
    isEnumType,
    isListType,
    isNonNullType,
    getNamedType,
} from "graphql";
import { FragmentService } from "./FragmentService";

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
    /** For union types, the fields for each variant type */
    unionVariants?: Record<string, Record<string, SemanticTypeInfo>>;
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
    private readonly fragmentService = new FragmentService();

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

        // Handle enum types
        if (isEnumType(namedType)) {
            return this.inferEnumType(namedType);
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
            return this.inferUnionType(
                namedType,
                selectionSet,
                fragmentRegistry,
            );
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
                // Default unknown custom scalars to any for type safety
                return {
                    typeString: "any",
                    isArray: false,
                    isNullable: true,
                };
        }
    }

    /**
     * Infers semantic type for GraphQL enum types.
     * Generates a union type of all enum values for precise typing.
     *
     * @param enumType - The GraphQL enum type
     * @returns Semantic type information for the enum
     */
    private inferEnumType(enumType: GraphQLEnumType): SemanticTypeInfo {
        const enumValues = enumType
            .getValues()
            .map((value) => `"${value.name}"`);
        const typeString = enumValues.join(" | ");

        return {
            typeString,
            isArray: false,
            isNullable: true,
        };
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

        // Always include __typename for object types with literal type
        objectFields["__typename"] = {
            typeString: `"${objectType.name}"`,
            isArray: false,
            isNullable: false,
        };

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
            } else if (selection.kind === "InlineFragment") {
                // Handle inline fragments by merging their fields
                if (selection.selectionSet) {
                    const inlineFields = this.inferObjectType(
                        objectType,
                        selection.selectionSet,
                        fragmentRegistry,
                    );
                    if (inlineFields.objectFields) {
                        Object.assign(objectFields, inlineFields.objectFields);
                    }
                }
            } else if (selection.kind === "FragmentSpread") {
                // Handle fragment spreads
                const fragmentName = selection.name.value;
                const fragmentFields = this.inferFragmentFieldsFromSchema(
                    fragmentName,
                    objectType,
                    fragmentRegistry,
                );
                if (fragmentFields) {
                    Object.assign(objectFields, fragmentFields);
                }
            }
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
     * @param selectionSet - The selection set with inline fragments
     * @param fragmentRegistry - Available fragment definitions
     * @returns Semantic type information for the union
     */
    private inferUnionType(
        unionType: GraphQLUnionType,
        selectionSet?: SelectionSetNode,
        fragmentRegistry?: Map<string, FragmentDefinitionNode>,
    ): SemanticTypeInfo {
        if (!selectionSet) {
            return { typeString: "null", isArray: false, isNullable: true };
        }

        const unionVariants: Record<
            string,
            Record<string, SemanticTypeInfo>
        > = {};

        // Process inline fragments to build union variants
        for (const selection of selectionSet.selections) {
            if (
                selection.kind === "InlineFragment" &&
                selection.typeCondition
            ) {
                const typeName = selection.typeCondition.name.value;
                const targetType = this.schema.getType(typeName);

                if (
                    targetType &&
                    (isObjectType(targetType) || isInterfaceType(targetType))
                ) {
                    const variantType = this.inferObjectType(
                        targetType,
                        selection.selectionSet,
                        fragmentRegistry,
                    );

                    if (variantType.objectFields) {
                        unionVariants[typeName] = variantType.objectFields;
                    }
                }
            }
        }

        return {
            typeString: "union",
            isArray: false,
            isNullable: true,
            unionVariants,
        };
    }

    /**
     * Creates a fallback type for unknown or unsupported GraphQL types.
     *
     * @returns A semantic type representing an unknown type
     */
    private createUnknownType(): SemanticTypeInfo {
        return {
            typeString: "unknown",
            isArray: false,
            isNullable: true,
        };
    }

    /**
     * Generates a TypeScript type string from semantic type information.
     *
     * @param typeInfo - The semantic type information
     * @returns A TypeScript type string
     */
    generateTypeString(typeInfo: SemanticTypeInfo): string {
        let baseType = typeInfo.typeString;

        // Handle object types with fields
        if (typeInfo.typeString === "object" && typeInfo.objectFields) {
            const fieldStrings = Object.entries(typeInfo.objectFields).map(
                ([key, fieldType]) => {
                    const keyStr = this.needsQuotes(key) ? `"${key}"` : key;
                    const nullableSuffix = fieldType.isNullable ? "?" : "";
                    const fieldTypeStr = this.generateTypeString(fieldType);
                    return `${keyStr}${nullableSuffix}: ${fieldTypeStr}`;
                },
            );
            baseType = `{ ${fieldStrings.join("; ")} }`;
        }

        // Handle union types
        if (typeInfo.typeString === "union" && typeInfo.unionVariants) {
            const variantStrings = Object.entries(typeInfo.unionVariants).map(
                ([typeName, fields]) => {
                    const fieldStrings = Object.entries(fields).map(
                        ([key, fieldType]) => {
                            const keyStr = this.needsQuotes(key)
                                ? `"${key}"`
                                : key;
                            const nullableSuffix = fieldType.isNullable
                                ? "?"
                                : "";
                            const fieldTypeStr =
                                this.generateTypeString(fieldType);
                            return `${keyStr}${nullableSuffix}: ${fieldTypeStr}`;
                        },
                    );
                    return `{ ${fieldStrings.join("; ")} }`;
                },
            );
            baseType = variantStrings.join(" | ");
        }

        // Handle arrays
        if (typeInfo.isArray) {
            baseType = `Array<${baseType}>`;
        }

        // Don't add "| null" to type definitions since we always generate concrete mock values
        // Nullability is handled at the field level with optional properties (field?: Type)

        return baseType;
    }

    /**
     * Determines if a property key needs quotes in TypeScript.
     *
     * @param key - The property key to check
     * @returns True if the key needs quotes
     */
    needsQuotes(key: string): boolean {
        return !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);
    }

    /**
     * Escapes a string for use in TypeScript code.
     *
     * @param str - The string to escape
     * @returns The escaped string
     */
    escapeString(str: string): string {
        return str
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"')
            .replace(/\n/g, "\\n")
            .replace(/\r/g, "\\r")
            .replace(/\t/g, "\\t");
    }

    /**
     * Generates an operation name with appropriate suffix based on operation type.
     *
     * @param operationName - The base operation name
     * @param operationType - The type of GraphQL operation
     * @returns The operation name with suffix
     */
    getOperationNameWithSuffix(
        operationName: string,
        operationType?: "query" | "mutation" | "subscription" | "fragment",
    ): string {
        if (!operationType) {
            return operationName;
        }

        const suffixMap = {
            query: "Query",
            mutation: "Mutation",
            subscription: "Subscription",
            fragment: "Fragment",
        };

        const suffix = suffixMap[operationType];
        const normalizedName = operationName.replace(
            /Query$|Mutation$|Subscription$|Fragment$/i,
            "",
        );

        return `${normalizedName}${suffix}`;
    }

    /**
     * Infers field types from a fragment definition using schema information.
     *
     * @param fragmentName - The name of the fragment
     * @param parentType - The parent type the fragment applies to
     * @param fragmentRegistry - Available fragment definitions
     * @returns Field type information or null if fragment not found
     */
    private inferFragmentFieldsFromSchema(
        fragmentName: string,
        parentType: GraphQLObjectType | GraphQLInterfaceType,
        fragmentRegistry?: Map<string, FragmentDefinitionNode>,
    ): Record<string, SemanticTypeInfo> | null {
        if (!fragmentRegistry) {
            return this.generateCommonFragmentFields(parentType);
        }

        const fragment = fragmentRegistry.get(fragmentName);
        if (!fragment) {
            return this.generateCommonFragmentFields(parentType);
        }

        // Get the target type for the fragment
        const targetTypeName = fragment.typeCondition.name.value;
        const targetType = this.schema.getType(targetTypeName);

        if (
            !targetType ||
            (!isObjectType(targetType) && !isInterfaceType(targetType))
        ) {
            return null;
        }

        // Infer types for the fragment's selection set
        const fragmentTypeInfo = this.inferObjectType(
            targetType,
            fragment.selectionSet,
            fragmentRegistry,
        );

        return fragmentTypeInfo.objectFields || null;
    }

    /**
     * Generates common fragment fields when fragment definition is not available.
     *
     * @param targetType - The target type for the fragment
     * @returns Common field type information
     */
    private generateCommonFragmentFields(
        targetType: GraphQLObjectType | GraphQLInterfaceType,
    ): Record<string, SemanticTypeInfo> {
        const fields: Record<string, SemanticTypeInfo> = {};

        // Always include __typename
        fields["__typename"] = {
            typeString: `"${targetType.name}"`,
            isArray: false,
            isNullable: false,
        };

        // Add common fields like id if they exist
        const typeFields = targetType.getFields();
        if (typeFields.id) {
            fields.id = this.analyzeGraphQLType(typeFields.id.type);
        }
        if (typeFields.name) {
            fields.name = this.analyzeGraphQLType(typeFields.name.type);
        }

        return fields;
    }
}
