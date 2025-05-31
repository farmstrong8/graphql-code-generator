import type {
    MockDataObject,
    MockDataVariants,
    GeneratedCodeArtifact,
} from "../types";
import type { NestedTypeInfo } from "../services/NestedTypeCollector";

/**
 * TypeScript Type Definition Generator
 *
 * A specialized utility class responsible for generating TypeScript type definitions
 * from mock data objects. This class handles the conversion of JavaScript values
 * into their corresponding TypeScript type representations.
 *
 * ## Key Features:
 *
 * - **Mock-to-Type Conversion**: Converts JavaScript mock values to TypeScript types
 * - **Schema Integration**: Uses pre-generated schema-based types when available
 * - **Nested Type Support**: Handles complex nested objects and arrays
 * - **Operation Type Inference**: Automatically infers operation types from naming
 * - **Type Name Generation**: Creates appropriate TypeScript type names
 *
 * ## Supported Type Conversions:
 *
 * - Primitives: `string`, `number`, `boolean`, `null`
 * - Arrays: `Array<T>` with element type inference
 * - Objects: Interface-like type definitions with proper property types
 * - Nested structures: Recursive type generation for complex data
 *
 * @example Basic Usage
 * ```typescript
 * const generator = new TypeDefinitionGenerator();
 *
 * const typeDefinition = generator.generateTypeDefinition(
 *   'queryUser',
 *   { id: '123', name: 'John', isActive: true }
 * );
 *
 * // Result: type QueryUser = { id: "123", name: "John", isActive: true };
 * ```
 *
 * @example With Schema Integration
 * ```typescript
 * const typeDefinition = generator.generateTypeDefinition(
 *   'getUserProfile',
 *   mockData,
 *   'User', // Pre-generated schema type
 *   'GetUserProfile',
 *   'query'
 * );
 *
 * // Result: type GetUserProfileQuery = User;
 * ```
 */
export class TypeDefinitionGenerator {
    /**
     * Generates a complete TypeScript type definition from mock data.
     *
     * This method creates a full type definition with proper naming conventions
     * and TypeScript syntax. It can either use a pre-generated schema-based type
     * or infer types directly from the mock data structure.
     *
     * @param mockName - The name identifier for the mock data (used for type naming)
     * @param mockValue - The actual mock data value to generate types from
     * @param schemaTypeBody - Optional pre-generated type body from GraphQL schema
     * @param operationName - Optional GraphQL operation name for enhanced naming
     * @param operationType - Optional operation type (query/mutation/subscription/fragment)
     * @returns Complete TypeScript type definition as a string
     *
     * @example Basic Mock-to-Type Generation
     * ```typescript
     * const definition = generator.generateTypeDefinition(
     *   'userProfile',
     *   {
     *     id: '123',
     *     name: 'Alice',
     *     email: 'alice@example.com',
     *     preferences: { theme: 'dark', notifications: true }
     *   }
     * );
     *
     * // Result:
     * // type UserProfile = {
     * //   id: "123",
     * //   name: "Alice",
     * //   email: "alice@example.com",
     * //   preferences: {
     * //     theme: "dark",
     * //     notifications: true
     * //   }
     * // };
     * ```
     *
     * @example Schema-Enhanced Generation
     * ```typescript
     * const definition = generator.generateTypeDefinition(
     *   'getUserData',
     *   mockUserData,
     *   '{ id: string; name: string; email: string }', // From schema
     *   'GetUser',
     *   'query'
     * );
     *
     * // Result: type GetUserQuery = { id: string; name: string; email: string };
     * ```
     */
    generateTypeDefinition(
        mockName: string,
        mockValue: unknown,
        schemaTypeBody?: string,
        operationName?: string,
        operationType?: "query" | "mutation" | "subscription" | "fragment",
    ): string {
        const typeName = this.getTypeNameFromMockName(
            mockName,
            operationName,
            operationType,
        );

        // Use schema-based type body if available, otherwise generate from mock
        const typeBody = schemaTypeBody || this.generateTypeBody(mockValue);

        return `type ${typeName} = ${typeBody};`;
    } /**
     * Generates TypeScript type body from a JavaScript value.
     *
     * This method performs the core logic of converting JavaScript runtime values
     * into their TypeScript type representations. It handles all common data types
     * and recursively processes complex structures.
     *
     * ## Type Conversion Rules:
     *
     * - **Null/Undefined**: Converts to `null`
     * - **String**: Converts to string literal type (e.g., `"hello"`)
     * - **Number/Boolean**: Converts to literal type (e.g., `42`, `true`)
     * - **Array**: Converts to `Array<T>` where T is inferred from first element
     * - **Object**: Converts to interface-like structure with property types
     *
     * @param value - The JavaScript value to convert to TypeScript type
     * @returns TypeScript type representation as a string
     *
     * @example Primitive Types
     * ```typescript
     * generateTypeBody("hello")    // '"hello"'
     * generateTypeBody(42)         // '42'
     * generateTypeBody(true)       // 'true'
     * generateTypeBody(null)       // 'null'
     * ```
     *
     * @example Complex Types
     * ```typescript
     * generateTypeBody(['a', 'b'])           // 'Array<"a">'
     * generateTypeBody({ x: 1, y: 2 })       // '{ x: 1, y: 2 }'
     * generateTypeBody({
     *   users: [{ id: 1, name: "John" }]
     * })
     * // Result:
     * // '{
     * //   users: Array<{
     * //     id: 1,
     * //     name: "John"
     * //   }>
     * // }'
     * ```
     */
    generateTypeBody(value: unknown): string {
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
    } /**
     * Generates a type definition for a nested type.
     *
     * @param builderName - The builder name
     * @param nestedTypeInfo - The nested type information
     * @param operationName - The operation name
     * @param typeInferenceService - Service for generating semantic types from GraphQL schema
     * @returns TypeScript type definition string
     */
    generateNestedTypeDefinition(
        builderName: string,
        nestedTypeInfo: NestedTypeInfo,
        operationName: string,
        typeInferenceService?: any,
    ): string {
        const typeName = builderName.substring(1); // Remove 'a' prefix

        // Generate semantic type body from the selection set if we have type inference service
        let typeBody: string;
        if (typeInferenceService) {
            try {
                const semanticType = typeInferenceService.analyzeGraphQLType(
                    nestedTypeInfo.graphqlType,
                    nestedTypeInfo.selectionSet,
                    new Map(), // Empty fragment registry for nested types
                );
                typeBody =
                    typeInferenceService.generateTypeString(semanticType);
            } catch (error) {
                // Fallback to simple definition if schema analysis fails
                typeBody = `{
  __typename: "${nestedTypeInfo.typeName}";
  [key: string]: unknown;
}`;
            }
        } else {
            // Fallback to simple definition without type inference service
            typeBody = `{
  __typename: "${nestedTypeInfo.typeName}";
  [key: string]: unknown;
}`;
        }

        return `type ${typeName} = ${typeBody};`;
    }
}
