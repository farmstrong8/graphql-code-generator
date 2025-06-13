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
    InlineFragmentNode,
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
                // Handle inline fragments for union types
                if (selection.selectionSet) {
                    // Get the type condition (e.g., "Todo", "Error")
                    const typeCondition = selection.typeCondition?.name.value;
                    if (typeCondition) {
                        // Find the type in the schema
                        const fragmentType = this.schema.getType(typeCondition);
                        if (
                            fragmentType &&
                            (isObjectType(fragmentType) ||
                                isInterfaceType(fragmentType))
                        ) {
                            // Process the fragment's selection set
                            for (const fragmentSelection of selection
                                .selectionSet.selections) {
                                if (fragmentSelection.kind === "Field") {
                                    const fieldName =
                                        fragmentSelection.name.value;
                                    const fieldDef =
                                        fragmentType.getFields()[fieldName];

                                    if (fieldDef) {
                                        objectFields[fieldName] =
                                            this.analyzeGraphQLType(
                                                fieldDef.type,
                                                fragmentSelection.selectionSet,
                                                fragmentRegistry,
                                            );
                                    }
                                }
                            }
                        }
                    }
                }
            } else if (selection.kind === "FragmentSpread") {
                // Handle fragment spreads (e.g., ...AuthorFragment)
                const fragmentName = selection.name.value;
                const fragmentDef = fragmentRegistry?.get(fragmentName);

                if (fragmentDef && fragmentDef.selectionSet) {
                    // Fragment definition available - use it
                    const typeCondition = fragmentDef.typeCondition.name.value;
                    const fragmentType = this.schema.getType(typeCondition);

                    if (
                        fragmentType &&
                        (isObjectType(fragmentType) ||
                            isInterfaceType(fragmentType))
                    ) {
                        // Recursively process the fragment's selection set
                        const fragmentFields = this.inferObjectType(
                            fragmentType,
                            fragmentDef.selectionSet,
                            fragmentRegistry,
                        );

                        // Merge fragment fields into current object fields
                        Object.assign(
                            objectFields,
                            fragmentFields.objectFields,
                        );
                    }
                } else {
                    // Fragment definition not available (near-operation-file mode)
                    // Fall back to schema-based analysis
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
     * @param selectionSet - Selection set containing inline fragments
     * @param fragmentRegistry - Available fragment definitions
     * @returns Semantic type information for the union
     */
    private inferUnionType(
        unionType: GraphQLUnionType,
        selectionSet?: SelectionSetNode,
        fragmentRegistry?: Map<string, FragmentDefinitionNode>,
    ): SemanticTypeInfo {
        if (!selectionSet) {
            // If no selection set, treat as generic object
            return {
                typeString: "object",
                isArray: false,
                isNullable: true,
            };
        }

        // Collect individual union variants instead of merging all fields
        const unionVariants: Record<
            string,
            Record<string, SemanticTypeInfo>
        > = {};
        const typeNames: string[] = [];

        // Process inline fragments
        for (const selection of selectionSet.selections) {
            if (selection.kind === "InlineFragment") {
                const typeCondition = selection.typeCondition?.name.value;
                if (typeCondition) {
                    typeNames.push(`"${typeCondition}"`);

                    // Initialize variant fields object for this specific type
                    const variantFields: Record<string, SemanticTypeInfo> = {};

                    // Find the type in the schema
                    const fragmentType = this.schema.getType(typeCondition);
                    if (
                        fragmentType &&
                        (isObjectType(fragmentType) ||
                            isInterfaceType(fragmentType))
                    ) {
                        // Process the fragment's selection set
                        if (selection.selectionSet) {
                            for (const fragmentSelection of selection
                                .selectionSet.selections) {
                                if (fragmentSelection.kind === "Field") {
                                    const fieldName =
                                        fragmentSelection.name.value;
                                    const fieldDef =
                                        fragmentType.getFields()[fieldName];

                                    if (fieldDef) {
                                        variantFields[fieldName] =
                                            this.analyzeGraphQLType(
                                                fieldDef.type,
                                                fragmentSelection.selectionSet,
                                                fragmentRegistry,
                                            );
                                    }
                                }
                            }
                        }
                    }

                    // Add __typename field for this specific variant
                    variantFields["__typename"] = {
                        typeString: `"${typeCondition}"`,
                        isArray: false,
                        isNullable: false,
                    };

                    // Store this variant's fields
                    unionVariants[typeCondition] = variantFields;
                }
            }
        }

        // Return union type information that preserves individual variants
        return {
            typeString: "union",
            isArray: false,
            isNullable: true,
            unionVariants: unionVariants,
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

        if (typeInfo.unionVariants) {
            // Generate union type from individual variants
            const variantTypes: string[] = [];
            for (const [typeName, fields] of Object.entries(
                typeInfo.unionVariants,
            )) {
                const properties: string[] = [];
                for (const [key, value] of Object.entries(fields)) {
                    const keyStr = this.needsQuotes(key) ? `"${key}"` : key;
                    const valueType = this.generateTypeString(value);
                    properties.push(`${keyStr}: ${valueType}`);
                }
                variantTypes.push(`{\n  ${properties.join(",\n  ")}\n}`);
            }
            baseType = variantTypes.join(" | ");
        } else if (typeInfo.objectFields) {
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
    needsQuotes(key: string): boolean {
        return !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) || key === "__typename";
    }

    /**
     * Escapes special characters in strings for use in TypeScript string literals.
     *
     * @param str - String to escape
     * @returns Escaped string safe for TypeScript literals
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
     * Adds operation type suffix to operation name following GraphQL code generation conventions.
     *
     * @param operationName - The base operation name (e.g., "GetUser")
     * @param operationType - The GraphQL operation type
     * @returns Operation name with appropriate suffix (e.g., "GetUserQuery")
     */
    getOperationNameWithSuffix(
        operationName: string,
        operationType?: "query" | "mutation" | "subscription" | "fragment",
    ): string {
        if (!operationType || operationType === "fragment") {
            return operationName;
        }

        const suffix =
            operationType.charAt(0).toUpperCase() + operationType.slice(1);

        // Avoid duplicate suffixes
        if (operationName.endsWith(suffix)) {
            return operationName;
        }

        return operationName + suffix;
    }

    /**
     * Infers fragment fields from schema when fragment definition is not available.
     * This is a fallback for near-operation-file mode where fragments are defined in separate files.
     *
     * @param fragmentName - The name of the fragment (e.g., "AuthorFragment")
     * @param parentType - The type that contains the field using this fragment
     * @param fragmentRegistry - Available fragment definitions (may be incomplete)
     * @returns Object fields that the fragment likely contains, or null if cannot be inferred
     */
    private inferFragmentFieldsFromSchema(
        fragmentName: string,
        parentType: GraphQLObjectType | GraphQLInterfaceType,
        fragmentRegistry?: Map<string, FragmentDefinitionNode>,
    ): Record<string, SemanticTypeInfo> | null {
        // Extract the type name from fragment name (e.g., "AuthorFragment" -> "Author")
        const targetTypeName =
            this.fragmentService.extractTypeNameFromFragmentName(fragmentName);

        if (!targetTypeName) {
            return null;
        }

        // Get the target type from schema
        const targetType = this.schema.getType(targetTypeName);
        if (
            !targetType ||
            (!isObjectType(targetType) && !isInterfaceType(targetType))
        ) {
            return null;
        }

        // Generate common fields that fragments typically include
        const commonFragmentFields =
            this.generateCommonFragmentFields(targetType);

        return commonFragmentFields;
    }

    /**
     * Generates a basic set of fields for fragment fallback.
     * When fragment definitions are not available, this provides a minimal
     * but reasonable set of fields based on the target type's schema.
     *
     * @param targetType - The GraphQL type to generate fields for
     * @returns Object fields with semantic type information
     */
    private generateCommonFragmentFields(
        targetType: GraphQLObjectType | GraphQLInterfaceType,
    ): Record<string, SemanticTypeInfo> {
        const fields: Record<string, SemanticTypeInfo> = {};
        const schemaFields = targetType.getFields();

        // Always include __typename for fragments
        fields["__typename"] = {
            typeString: `"${targetType.name}"`,
            isArray: false,
            isNullable: false,
        };

        // Include scalar fields from the type, up to a reasonable limit
        let fieldCount = 0;
        const maxFields = 3;

        for (const [fieldName, fieldDef] of Object.entries(schemaFields)) {
            if (fieldCount >= maxFields) break;

            const namedType = getNamedType(fieldDef.type);
            if (isScalarType(namedType)) {
                fields[fieldName] = this.analyzeGraphQLType(fieldDef.type);
                fieldCount++;
            }
        }

        return fields;
    }
}
