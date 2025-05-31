import type {
    MockDataObject,
    MockDataVariants,
    GeneratedCodeArtifact,
} from "../types";
import { MOCK_BUILDER_BOILERPLATE } from "../utils/codeTemplates";

/**
 * Builds TypeScript code from mock data objects.
 *
 * This builder takes JavaScript mock objects and generates TypeScript code
 * with proper typing and builder functions for easy testing.
 */
export class TypeScriptCodeBuilder {
    /**
     * Generates a complete code artifact from mock data objects.
     *
     * @param operationName - Name of the GraphQL operation
     * @param operationType - Type of operation (query, mutation, subscription, fragment)
     * @param mockDataObjects - Array of mock data objects to convert
     * @returns Complete code artifact with TypeScript code
     */
    buildCodeArtifact(
        operationName: string,
        operationType: "query" | "mutation" | "subscription" | "fragment",
        mockDataObjects: MockDataVariants,
    ): GeneratedCodeArtifact {
        // Start with the imports and boilerplate
        const codeBlocks: string[] = [MOCK_BUILDER_BOILERPLATE];

        // Add each mock data object
        for (const mockData of mockDataObjects) {
            const typeDefinition = this.generateTypeDefinition(
                mockData.mockName,
                mockData.mockValue,
            );
            const builderFunction = this.generateBuilderFunction(
                mockData.mockName,
                mockData.mockValue,
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

        // Generate the type definition
        const typeDefinition = this.generateTypeDefinition(mockName, mockValue);

        // Generate the builder function
        const builderFunction = this.generateBuilderFunction(
            mockName,
            mockValue,
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
            operationType: this.inferOperationType(mockName),
            generatedCode,
        };
    }

    /**
     * Generates a TypeScript type definition from a mock data object.
     *
     * @param mockName - The name of the mock data object
     * @param mockValue - The value of the mock data object
     * @returns TypeScript type definition string
     */
    private generateTypeDefinition(
        mockName: string,
        mockValue: unknown,
    ): string {
        const typeName = this.getTypeNameFromMockName(mockName);
        const typeBody = this.generateTypeBody(mockValue);

        return `type ${typeName} = ${typeBody};`;
    }

    /**
     * Generates a builder function from a mock data object.
     *
     * @param mockName - The name of the mock data object
     * @param mockValue - The value of the mock data object
     * @returns TypeScript builder function string
     */
    private generateBuilderFunction(
        mockName: string,
        mockValue: unknown,
    ): string {
        const typeName = this.getTypeNameFromMockName(mockName);
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
     * @returns Capitalized type name
     */
    private getTypeNameFromMockName(mockName: string): string {
        // Capitalize first letter for type name
        return mockName.charAt(0).toUpperCase() + mockName.slice(1);
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
}
