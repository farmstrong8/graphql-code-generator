import type {
    MockDataObject,
    MockDataVariants,
    GeneratedCodeArtifact,
} from "../types";
import type {
    GraphQLObjectType,
    GraphQLInterfaceType,
    SelectionSetNode,
    FragmentDefinitionNode,
} from "graphql";
import { MOCK_BUILDER_BOILERPLATE } from "../utils/codeTemplates";
import type {
    TypeInferenceService,
    SemanticTypeInfo,
} from "../services/TypeInferenceService";
import type {
    NestedTypeCollector,
    NestedTypeInfo,
} from "../services/NestedTypeCollector";

/**
 * Context information for generating semantic types from GraphQL schema.
 */
export interface SchemaGenerationContext {
    parentType: GraphQLObjectType | GraphQLInterfaceType;
    selectionSet: SelectionSetNode;
    fragmentRegistry: Map<string, FragmentDefinitionNode>;
}

/**
 * Builds TypeScript code from mock data objects.
 *
 * This builder takes JavaScript mock objects and generates TypeScript code
 * with proper typing and builder functions for easy testing.
 */
export class TypeScriptCodeBuilder {
    constructor(
        private readonly typeInferenceService: TypeInferenceService,
        private readonly nestedTypeCollector: NestedTypeCollector,
    ) {}
    /**
     * Generates a complete code artifact from mock data objects.
     *
     * @param operationName - Name of the GraphQL operation
     * @param operationType - Type of operation (query, mutation, subscription, fragment)
     * @param mockDataObjects - Array of mock data objects to convert
     * @param schemaContext - GraphQL schema context for semantic type generation
     * @returns Complete code artifact with TypeScript code
     */
    buildCodeArtifact(
        operationName: string,
        operationType: "query" | "mutation" | "subscription" | "fragment",
        mockDataObjects: MockDataVariants,
        schemaContext?: SchemaGenerationContext,
    ): GeneratedCodeArtifact {
        // Start with the imports and boilerplate
        const codeBlocks: string[] = [MOCK_BUILDER_BOILERPLATE];

        // Collect nested types that should have their own builders
        const nestedTypes: Map<string, any> = new Map();
        if (schemaContext) {
            const nestedTypeInfos =
                this.nestedTypeCollector.collectFromSelectionSet({
                    parentType: schemaContext.parentType,
                    selectionSet: schemaContext.selectionSet,
                    operationName,
                    fragmentRegistry: schemaContext.fragmentRegistry,
                });

            // Generate builders for nested types first
            for (const nestedTypeInfo of nestedTypeInfos) {
                const nestedBuilderName = this.generateNestedBuilderName(
                    operationName,
                    nestedTypeInfo.typeName,
                );
                const nestedMockValue = this.extractNestedMockValue(
                    mockDataObjects,
                    nestedTypeInfo,
                );

                if (nestedMockValue) {
                    const nestedTypeDefinition =
                        this.generateNestedTypeDefinition(
                            nestedBuilderName,
                            nestedTypeInfo,
                            operationName,
                        );
                    const nestedBuilderFunction =
                        this.generateNestedBuilderFunction(
                            nestedBuilderName,
                            nestedMockValue,
                            nestedTypeInfo.typeName,
                        );

                    codeBlocks.push("");
                    codeBlocks.push(nestedTypeDefinition);
                    codeBlocks.push("");
                    codeBlocks.push(nestedBuilderFunction);

                    // Store for reference replacement in main builders
                    nestedTypes.set(nestedTypeInfo.typeName, nestedBuilderName);
                }
            }
        }

        // Add each mock data object
        for (const mockData of mockDataObjects) {
            const typeDefinition = this.generateTypeDefinition(
                mockData.mockName,
                mockData.mockValue,
                schemaContext,
                operationName,
                operationType,
                nestedTypes,
            );
            const builderFunction = this.generateBuilderFunction(
                mockData.mockName,
                mockData.mockValue,
                operationName,
                operationType,
                nestedTypes,
            );

            codeBlocks.push("");
            codeBlocks.push(typeDefinition);
            codeBlocks.push("");
            codeBlocks.push(builderFunction);
        }

        return {
            operationName,
            operationType,
            generatedCode: codeBlocks.join("\n"),
        };
    }

    /**
     * Generates TypeScript code from a mock data object.
     *
     * @param mockData - The mock data object to generate code from
     * @returns Generated code artifact containing TypeScript code
     */
    generateCode(mockData: MockDataObject): GeneratedCodeArtifact {
        const { mockName, mockValue } = mockData;
        const operationType = this.inferOperationType(mockName);

        // Generate the type definition
        const typeDefinition = this.generateTypeDefinition(
            mockName,
            mockValue,
            undefined,
            undefined,
            operationType,
        );

        // Generate the builder function
        const builderFunction = this.generateBuilderFunction(
            mockName,
            mockValue,
            undefined,
            operationType,
        );

        // Combine all parts
        const generatedCode = [
            MOCK_BUILDER_BOILERPLATE,
            "",
            typeDefinition,
            "",
            builderFunction,
        ].join("\n");

        return {
            operationName: mockName,
            operationType,
            generatedCode,
        };
    }

    /**
     * Generates a TypeScript type definition from a mock data object.
     *
     * @param mockName - The name of the mock data object
     * @param mockValue - The value of the mock data object
     * @param schemaContext - Optional GraphQL schema context for semantic types
     * @param operationName - The name of the GraphQL operation
     * @param operationType - The type of the GraphQL operation
     * @param nestedTypes - Map of nested types to their builder names (optional)
     * @returns TypeScript type definition string
     */
    private generateTypeDefinition(
        mockName: string,
        mockValue: unknown,
        schemaContext?: SchemaGenerationContext,
        operationName?: string,
        operationType?: "query" | "mutation" | "subscription" | "fragment",
        nestedTypes?: Map<string, string>,
    ): string {
        const typeName = this.getTypeNameFromMockName(
            mockName,
            operationName,
            operationType,
        );

        // Use semantic types from schema if available, otherwise fall back to mock-based types
        const typeBody = schemaContext
            ? this.generateSemanticTypeBodyWithNestedTypes(
                  schemaContext,
                  nestedTypes,
                  mockValue,
              )
            : this.generateTypeBody(mockValue);

        return `type ${typeName} = ${typeBody};`;
    }

    /**
     * Generates a builder function from a mock data object.
     *
     * @param mockName - The name of the mock data object
     * @param mockValue - The value of the mock data object
     * @param operationName - The name of the GraphQL operation
     * @param operationType - The type of the GraphQL operation
     * @param nestedTypes - Map of nested types to their builder names (optional)
     * @returns TypeScript builder function string
     */
    private generateBuilderFunction(
        mockName: string,
        mockValue: unknown,
        operationName?: string,
        operationType?: "query" | "mutation" | "subscription" | "fragment",
        nestedTypes?: Map<string, string>,
    ): string {
        const typeName = this.getTypeNameFromMockName(
            mockName,
            operationName,
            operationType,
        );
        const builderName = `a${typeName}`;
        const mockValueString = this.generateMockValue(mockValue, nestedTypes);

        return `export const ${builderName} = createBuilder<${typeName}>(${mockValueString});`;
    }

    /**
     * Infers the operation type from the mock name.
     *
     * @param mockName - The name of the mock data object
     * @returns Inferred operation type (query, mutation, etc.)
     */
    private inferOperationType(
        mockName: string,
    ): "query" | "mutation" | "subscription" | "fragment" {
        // Simple inference based on name prefix
        if (mockName.startsWith("query")) {
            return "query";
        } else if (mockName.startsWith("mutation")) {
            return "mutation";
        } else if (mockName.startsWith("subscription")) {
            return "subscription";
        } else {
            return "fragment";
        }
    }

    /**
     * Generates the type body from a mock value.
     *
     * @param value - The mock value to convert
     * @returns TypeScript type body string
     */
    private generateTypeBody(value: unknown): string {
        if (value === null || value === undefined) {
            return "null";
        }

        if (typeof value === "string") {
            return `"${this.escapeString(value)}"`;
        }

        if (typeof value === "number" || typeof value === "boolean") {
            return String(value);
        }

        if (Array.isArray(value)) {
            if (value.length === 0) {
                return "unknown[]";
            }
            const elementType = this.generateTypeBody(value[0]);
            return `Array<${elementType}>`;
        }

        if (typeof value === "object") {
            const properties: string[] = [];

            for (const [key, val] of Object.entries(value)) {
                const keyStr = this.needsQuotes(key) ? `"${key}"` : key;
                const valueType = this.generateTypeBody(val);
                properties.push(`${keyStr}: ${valueType}`);
            }

            return `{\n  ${properties.join(",\n  ")}\n}`;
        }

        return "unknown";
    }

    /**
     * Generates the mock value as a TypeScript literal.
     *
     * @param value - The mock value to convert
     * @param nestedTypes - Map of nested types to their builder names (optional)
     * @returns TypeScript literal string
     */
    private generateMockValue(
        value: unknown,
        nestedTypes?: Map<string, string>,
    ): string {
        if (value === null || value === undefined) {
            return "null";
        }

        if (typeof value === "string") {
            return `"${this.escapeString(value)}"`;
        }

        if (typeof value === "number" || typeof value === "boolean") {
            return String(value);
        }

        if (Array.isArray(value)) {
            const elements = value.map((item) =>
                this.generateMockValue(item, nestedTypes),
            );
            return `[${elements.join(", ")}]`;
        }

        if (typeof value === "object") {
            const obj = value as Record<string, unknown>;

            // Check if this object has a __typename that matches a nested type
            if (
                nestedTypes &&
                obj.__typename &&
                nestedTypes.has(obj.__typename as string)
            ) {
                const builderName = nestedTypes.get(obj.__typename as string);
                return `${builderName}()`;
            }

            const properties: string[] = [];

            for (const [key, val] of Object.entries(obj)) {
                const keyStr = this.needsQuotes(key) ? `"${key}"` : key;
                const valueStr = this.generateMockValue(val, nestedTypes);
                properties.push(`${keyStr}: ${valueStr}`);
            }

            return `{\n  ${properties.join(",\n  ")}\n}`;
        }

        return "null";
    }

    /**
     * Converts a mock name to a TypeScript type name.
     *
     * @param mockName - The mock name
     * @param operationName - Optional operation name to use as base type name
     * @param operationType - Optional operation type to append as suffix
     * @returns Capitalized type name
     */
    private getTypeNameFromMockName(
        mockName: string,
        operationName?: string,
        operationType?: "query" | "mutation" | "subscription" | "fragment",
    ): string {
        // If we have an operation name and the mock name contains "As", use operation name + variant
        if (operationName && mockName.includes("As")) {
            const variantPart = mockName.split("As")[1];
            const baseName = this.getOperationNameWithSuffix(
                operationName,
                operationType,
            );
            return baseName + (variantPart ? `As${variantPart}` : "");
        }

        // If the mockName already has the expected operation suffix or is a variant, use it directly
        if (operationName) {
            const expectedSuffix = this.getOperationNameWithSuffix(
                operationName,
                operationType,
            );

            // If mockName is exactly the expected name or is a variant of it, use mockName
            if (
                mockName === expectedSuffix ||
                mockName.startsWith(expectedSuffix) ||
                mockName.includes("Variant")
            ) {
                return mockName;
            }

            // Otherwise, use the operation name with suffix
            return expectedSuffix;
        }

        // Fallback to capitalizing mock name
        return mockName.charAt(0).toUpperCase() + mockName.slice(1);
    }

    /**
     * Adds operation type suffix to operation name.
     *
     * @param operationName - The operation name
     * @param operationType - The operation type
     * @returns Operation name with appropriate suffix
     */
    private getOperationNameWithSuffix(
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
     * Escapes special characters in strings for TypeScript literals.
     *
     * @param str - String to escape
     * @returns Escaped string
     */
    private escapeString(str: string): string {
        return str
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"')
            .replace(/\n/g, "\\n")
            .replace(/\r/g, "\\r")
            .replace(/\t/g, "\\t");
    }

    /**
     * Determines if a property key needs quotes in TypeScript.
     *
     * @param key - Property key to check
     * @returns True if quotes are needed
     */
    private needsQuotes(key: string): boolean {
        // Simple check for valid JavaScript identifier
        return !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) || key === "__typename";
    }

    /**
     * Generates semantic type body from GraphQL schema context.
     *
     * @param schemaContext - GraphQL schema context
     * @returns TypeScript semantic type body string
     */
    private generateSemanticTypeBody(
        schemaContext: SchemaGenerationContext,
    ): string {
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
    private generateSemanticTypeBodyWithNestedTypes(
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
        semanticType: any,
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
     * Generates a builder name for a nested type.
     *
     * @param operationName - The operation name
     * @param typeName - The GraphQL type name
     * @returns A unique builder name for the nested type
     */
    private generateNestedBuilderName(
        operationName: string,
        typeName: string,
    ): string {
        return `a${operationName}${typeName}`;
    }

    /**
     * Extracts mock value for a nested type from the mock data objects.
     *
     * @param mockDataObjects - The mock data objects to search
     * @param nestedTypeInfo - The nested type information
     * @returns The mock value for the nested type, if found
     */
    private extractNestedMockValue(
        mockDataObjects: MockDataVariants,
        nestedTypeInfo: NestedTypeInfo,
    ): unknown {
        // Find the first object in mock data that matches the nested type
        for (const mockData of mockDataObjects) {
            const found = this.findNestedValueByType(
                mockData.mockValue,
                nestedTypeInfo.typeName,
            );
            if (found) {
                return found;
            }
        }
        return null;
    }

    /**
     * Recursively searches for a value with a specific __typename.
     *
     * @param value - The value to search in
     * @param typeName - The __typename to find
     * @returns The found object, if any
     */
    private findNestedValueByType(value: unknown, typeName: string): unknown {
        if (value === null || value === undefined) {
            return null;
        }

        if (Array.isArray(value)) {
            for (const item of value) {
                const found = this.findNestedValueByType(item, typeName);
                if (found) return found;
            }
            return null;
        }

        if (typeof value === "object") {
            const obj = value as Record<string, unknown>;
            if (obj.__typename === typeName) {
                return obj;
            }

            // Search in nested objects
            for (const val of Object.values(obj)) {
                const found = this.findNestedValueByType(val, typeName);
                if (found) return found;
            }
        }

        return null;
    }

    /**
     * Generates a type definition for a nested type.
     *
     * @param builderName - The builder name
     * @param nestedTypeInfo - The nested type information
     * @param operationName - The operation name
     * @returns TypeScript type definition string
     */
    private generateNestedTypeDefinition(
        builderName: string,
        nestedTypeInfo: NestedTypeInfo,
        operationName: string,
    ): string {
        const typeName = builderName.substring(1); // Remove 'a' prefix

        // Generate semantic type body from the selection set
        const schemaContext: SchemaGenerationContext = {
            parentType: nestedTypeInfo.graphqlType,
            selectionSet: nestedTypeInfo.selectionSet,
            fragmentRegistry: new Map(), // TODO: Pass actual fragment registry
        };

        const typeBody = this.generateSemanticTypeBody(schemaContext);
        return `type ${typeName} = ${typeBody};`;
    }

    /**
     * Generates a builder function for a nested type.
     *
     * @param builderName - The builder name
     * @param mockValue - The mock value
     * @param typeName - The GraphQL type name
     * @returns TypeScript builder function string
     */
    private generateNestedBuilderFunction(
        builderName: string,
        mockValue: unknown,
        typeName: string,
    ): string {
        const typeNameForBuilder = builderName.substring(1); // Remove 'a' prefix
        const mockValueString = this.generateMockValue(mockValue);

        return `export const ${builderName} = createBuilder<${typeNameForBuilder}>(${mockValueString});`;
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
