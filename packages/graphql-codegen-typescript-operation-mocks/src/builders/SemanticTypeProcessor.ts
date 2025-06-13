import type {
    GraphQLObjectType,
    GraphQLInterfaceType,
    SelectionSetNode,
    FragmentDefinitionNode,
} from "graphql";
import type {
    TypeInferenceService,
    SemanticTypeInfo,
} from "../services/TypeInferenceService";

/**
 * Context information for generating semantic types from GraphQL schema.
 */
export interface SchemaGenerationContext {
    parentType: GraphQLObjectType | GraphQLInterfaceType;
    selectionSet: SelectionSetNode;
    fragmentRegistry: Map<string, FragmentDefinitionNode>;
}

/**
 * Semantic Type Processor for GraphQL Schema Integration
 *
 * A specialized utility class that processes GraphQL schema information to generate
 * semantic TypeScript types. This class bridges the gap between GraphQL schema
 * definitions and TypeScript type generation, providing schema-aware type inference.
 *
 * ## Key Capabilities:
 *
 * - **Schema-Based Type Generation**: Uses GraphQL schema to generate accurate types
 * - **Selection Set Processing**: Analyzes GraphQL selection sets for type inference
 * - **Fragment Integration**: Handles GraphQL fragments and their type implications
 * - **Union Variant Resolution**: Resolves union types based on actual mock data
 * - **Nested Type References**: Manages complex nested type relationships
 * - **Type String Generation**: Converts semantic type info to TypeScript strings
 *
 * ## GraphQL Integration:
 *
 * This processor works with the TypeInferenceService to:
 * 1. Analyze GraphQL types from schema definitions
 * 2. Process selection sets to determine required fields
 * 3. Handle fragments and their type contributions
 * 4. Generate accurate TypeScript representations
 *
 * @example Basic Schema Processing
 * ```typescript
 * const processor = new SemanticTypeProcessor(typeInferenceService);
 *
 * const schemaContext = {
 *   parentType: UserType,
 *   selectionSet: userSelectionSet,
 *   fragmentRegistry: new Map()
 * };
 *
 * const typeBody = processor.generateSemanticTypeBody(schemaContext);
 * // Result: "{ id: string; name: string; email: string; }"
 * ```
 *
 * @example With Nested Types
 * ```typescript
 * const nestedTypes = new Map([['Profile', 'UserProfile']]);
 *
 * const typeBody = processor.generateSemanticTypeBodyWithNestedTypes(
 *   schemaContext,
 *   nestedTypes,
 *   mockData
 * );
 * // Result: "{ id: string; name: string; profile: UserProfile; }"
 * ```
 */
export class SemanticTypeProcessor {
    /**
     * Creates a new SemanticTypeProcessor instance.
     *
     * @param typeInferenceService - Service for analyzing GraphQL types and generating TypeScript
     */
    constructor(private readonly typeInferenceService: TypeInferenceService) {}

    /**
     * Generates semantic type body from GraphQL schema context.
     *
     * @param schemaContext - GraphQL schema context
     * @returns TypeScript semantic type body string
     */
    generateSemanticTypeBody(schemaContext: SchemaGenerationContext): string {
        const { parentType, selectionSet, fragmentRegistry } = schemaContext;

        // Use TypeInferenceService to generate semantic types
        const semanticType = this.typeInferenceService.analyzeGraphQLType(
            parentType,
            selectionSet,
            fragmentRegistry,
        );

        return this.typeInferenceService.generateTypeString(semanticType);
    }

    /**
     * Generates semantic type body from GraphQL schema context with nested type references.
     *
     * @param schemaContext - GraphQL schema context
     * @param nestedTypes - Map of nested types to their builder names
     * @param mockValue - The mock value to use for union variant resolution
     * @returns TypeScript semantic type body string
     */
    generateSemanticTypeBodyWithNestedTypes(
        schemaContext: SchemaGenerationContext,
        nestedTypes?: Map<string, string>,
        mockValue?: unknown,
    ): string {
        const { parentType, selectionSet, fragmentRegistry } = schemaContext;

        // Use TypeInferenceService to generate semantic types
        const semanticType = this.typeInferenceService.analyzeGraphQLType(
            parentType,
            selectionSet,
            fragmentRegistry,
        );

        // If we have mock data, resolve union variants to specific types
        if (mockValue) {
            this.resolveUnionVariantsInSemanticType(semanticType, mockValue);
        }

        return this.generateTypeStringWithNestedTypes(
            semanticType,
            nestedTypes,
        );
    }

    /**
     * Generates a TypeScript type string from semantic type info, replacing nested objects with type references.
     *
     * @param semanticType - The semantic type information
     * @param nestedTypes - Map of nested types to their builder names
     * @returns TypeScript type string
     */
    private generateTypeStringWithNestedTypes(
        semanticType: SemanticTypeInfo,
        nestedTypes?: Map<string, string>,
    ): string {
        // If no nested types, fall back to regular generation
        if (!nestedTypes) {
            return this.typeInferenceService.generateTypeString(semanticType);
        }

        // Generate the type string but replace nested object types with references
        return this.replaceNestedObjectsWithReferences(
            this.typeInferenceService.generateTypeString(semanticType),
            nestedTypes,
        );
    }

    /**
     * Replaces inline nested object types with type references.
     *
     * @param typeString - The original type string
     * @param nestedTypes - Map of nested types to their builder names
     * @returns Updated type string with nested type references
     */
    private replaceNestedObjectsWithReferences(
        typeString: string,
        nestedTypes: Map<string, string>,
    ): string {
        let result = typeString;

        // For each nested type, replace the inline object with a reference
        for (const [typeName, builderName] of nestedTypes.entries()) {
            const typeNameForReference = builderName.substring(1); // Remove 'a' prefix

            // Use a more robust approach to find and replace nested objects
            result = this.replaceNestedObjectOfType(
                result,
                typeName,
                typeNameForReference,
            );
        }

        return result;
    }

    /**
     * Replaces nested objects of a specific type with type references.
     * This method properly handles nested braces and complex object structures.
     */
    private replaceNestedObjectOfType(
        typeString: string,
        targetTypeName: string,
        replacementType: string,
    ): string {
        let result = typeString;

        // Look for objects that contain __typename: "TargetType"
        const typenamePattern = `"__typename": "${targetTypeName}"`;

        let searchIndex = 0;
        while (true) {
            const typenameIndex = result.indexOf(typenamePattern, searchIndex);
            if (typenameIndex === -1) break;

            // Find the opening brace before this __typename
            let openBraceIndex = typenameIndex;
            while (openBraceIndex > 0 && result[openBraceIndex] !== "{") {
                openBraceIndex--;
            }

            if (openBraceIndex === 0) {
                searchIndex = typenameIndex + typenamePattern.length;
                continue;
            }

            // Find the matching closing brace
            const closeBraceIndex = this.findMatchingCloseBrace(
                result,
                openBraceIndex,
            );

            if (closeBraceIndex === -1) {
                searchIndex = typenameIndex + typenamePattern.length;
                continue;
            }

            // Extract the full object definition
            const objectDef = result.substring(
                openBraceIndex,
                closeBraceIndex + 1,
            );

            // Check if this is wrapped in Array<...>
            const arrayStart = result.lastIndexOf("Array<", openBraceIndex);
            const nextArrayClose = result.indexOf(">", closeBraceIndex);

            if (
                arrayStart !== -1 &&
                nextArrayClose !== -1 &&
                result.substring(arrayStart + 6, openBraceIndex).trim() === ""
            ) {
                // This is an Array<{...}> pattern
                const replacement = `Array<${replacementType}>`;
                result =
                    result.substring(0, arrayStart) +
                    replacement +
                    result.substring(nextArrayClose + 1);
                searchIndex = arrayStart + replacement.length;
            } else {
                // This is a direct object pattern
                result =
                    result.substring(0, openBraceIndex) +
                    replacementType +
                    result.substring(closeBraceIndex + 1);
                searchIndex = openBraceIndex + replacementType.length;
            }
        }

        return result;
    }

    /**
     * Finds the matching closing brace for an opening brace, properly handling nested braces.
     */
    private findMatchingCloseBrace(str: string, openIndex: number): number {
        let braceCount = 1;
        let i = openIndex + 1;

        while (i < str.length && braceCount > 0) {
            if (str[i] === "{") {
                braceCount++;
            } else if (str[i] === "}") {
                braceCount--;
            }
            i++;
        }

        return braceCount === 0 ? i - 1 : -1;
    }

    /**
     * Resolves union variants in semantic types based on actual mock data.
     * This replaces union types with specific variant types based on __typename in mock data.
     *
     * @param semanticType - The semantic type to modify
     * @param mockValue - The mock value to determine variant types from
     */
    private resolveUnionVariantsInSemanticType(
        semanticType: SemanticTypeInfo,
        mockValue: unknown,
    ): void {
        if (
            !semanticType.objectFields ||
            typeof mockValue !== "object" ||
            !mockValue
        ) {
            return;
        }

        const mockObject = mockValue as Record<string, unknown>;

        // Recursively process object fields
        for (const [fieldName, fieldType] of Object.entries(
            semanticType.objectFields,
        )) {
            const fieldMockValue = mockObject[fieldName];

            if (
                fieldType.unionVariants &&
                fieldMockValue &&
                typeof fieldMockValue === "object"
            ) {
                const fieldMockObject = fieldMockValue as Record<
                    string,
                    unknown
                >;
                const typename = fieldMockObject.__typename;

                if (
                    typename &&
                    typeof typename === "string" &&
                    fieldType.unionVariants[typename]
                ) {
                    // Replace the union with the specific variant
                    const variantFields = fieldType.unionVariants[typename];
                    fieldType.unionVariants = undefined; // Clear union variants
                    fieldType.objectFields = variantFields; // Set specific variant fields
                    fieldType.typeString = "object"; // Change from "union" to "object"
                }
            }

            // Recursively process nested objects
            if (fieldType.objectFields) {
                this.resolveUnionVariantsInSemanticType(
                    fieldType,
                    fieldMockValue,
                );
            }
        }
    }
}
