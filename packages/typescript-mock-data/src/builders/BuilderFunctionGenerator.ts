/**
 * TypeScript Builder Function Generator
 *
 * A specialized utility class for generating TypeScript builder functions that create
 * mock data objects with proper type safety. This class transforms JavaScript mock
 * values into TypeScript builder patterns commonly used in testing frameworks.
 *
 * ## Key Features:
 *
 * - **Builder Pattern Generation**: Creates `createBuilder<T>()` function calls
 * - **Type-Safe Mock Values**: Generates properly typed mock object literals
 * - **Nested Type Integration**: Handles references to nested builder functions
 * - **GraphQL-Aware Naming**: Supports operation-based and nested type naming
 * - **Recursive Value Processing**: Handles complex nested data structures
 *
 * ## Generated Builder Pattern:
 *
 * The generated builders follow this pattern:
 * ```typescript
 * export const aTypeName = createBuilder<TypeName>(mockValueLiteral);
 * ```
 *
 * This allows for flexible mock data creation in tests:
 * ```typescript
 * const user = aUser(); // Default mock
 * const customUser = aUser({ name: 'Custom Name' }); // Override specific fields
 * ```
 *
 * @example Basic Builder Generation
 * ```typescript
 * const generator = new BuilderFunctionGenerator();
 *
 * const builder = generator.generateBuilderFunction(
 *   'queryUser',
 *   { id: '123', name: 'John', isActive: true }
 * );
 *
 * // Result:
 * // export const aQueryUser = createBuilder<QueryUser>({
 * //   id: "123",
 * //   name: "John",
 * //   isActive: true
 * // });
 * ```
 *
 * @example Nested Type Integration
 * ```typescript
 * const nestedTypes = new Map([['User', 'aGetUserUser']]);
 *
 * const builder = generator.generateBuilderFunction(
 *   'queryUserProfile',
 *   { user: { __typename: 'User', id: '123' } },
 *   'GetUserProfile',
 *   'query',
 *   nestedTypes
 * );
 *
 * // Result:
 * // export const aGetUserProfileQuery = createBuilder<GetUserProfileQuery>({
 * //   user: aGetUserUser()
 * // });
 * ```
 */
export class BuilderFunctionGenerator {
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
    generateBuilderFunction(
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
     * Generates a builder function for a nested type.
     *
     * @param builderName - The builder name
     * @param mockValue - The mock value
     * @param typeName - The GraphQL type name
     * @returns TypeScript builder function string
     */
    generateNestedBuilderFunction(
        builderName: string,
        mockValue: unknown,
        typeName: string,
    ): string {
        const typeNameForBuilder = builderName.substring(1); // Remove 'a' prefix
        const mockValueString = this.generateMockValue(mockValue);

        return `export const ${builderName} = createBuilder<${typeNameForBuilder}>(${mockValueString});`;
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
}
