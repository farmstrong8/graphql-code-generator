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
import type { TypeInferenceService } from "../services/TypeInferenceService";
import type { NestedTypeCollector } from "../services/NestedTypeCollector";

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

        // Add each mock data object
        for (const mockData of mockDataObjects) {
            const typeDefinition = this.generateTypeDefinition(
                mockData.mockName,
                mockData.mockValue,
                schemaContext,
                operationName,
                operationType,
            );
            const builderFunction = this.generateBuilderFunction(
                mockData.mockName,
                mockData.mockValue,
                operationName,
                operationType,
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
     * @returns TypeScript type definition string
     */
    private generateTypeDefinition(
        mockName: string,
        mockValue: unknown,
        schemaContext?: SchemaGenerationContext,
        operationName?: string,
        operationType?: "query" | "mutation" | "subscription" | "fragment",
    ): string {
        const typeName = this.getTypeNameFromMockName(
            mockName,
            operationName,
            operationType,
        );

        // Use semantic types from schema if available, otherwise fall back to mock-based types
        const typeBody = schemaContext
            ? this.generateSemanticTypeBody(schemaContext)
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
     * @returns TypeScript builder function string
     */
    private generateBuilderFunction(
        mockName: string,
        mockValue: unknown,
        operationName?: string,
        operationType?: "query" | "mutation" | "subscription" | "fragment",
    ): string {
        const typeName = this.getTypeNameFromMockName(
            mockName,
            operationName,
            operationType,
        );
        const builderName = `a${typeName}`;
        const mockValueString = this.generateMockValue(mockValue);

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
     * @returns TypeScript literal string
     */
    private generateMockValue(value: unknown): string {
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
            const elements = value.map((item) => this.generateMockValue(item));
            return `[${elements.join(", ")}]`;
        }

        if (typeof value === "object") {
            const properties: string[] = [];

            for (const [key, val] of Object.entries(value)) {
                const keyStr = this.needsQuotes(key) ? `"${key}"` : key;
                const valueStr = this.generateMockValue(val);
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
}
