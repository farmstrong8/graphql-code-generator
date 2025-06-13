import type { MockDataVariants } from "../types";
import type { NestedTypeInfo } from "../services/NestedTypeCollector";

/**
 * Nested Type Handler for Complex GraphQL Structures
 *
 * A specialized utility class for managing nested types in GraphQL operations.
 * This class handles the complexity of identifying, extracting, and organizing
 * nested types that require their own builder functions and type definitions.
 *
 * ## Core Responsibilities:
 *
 * - **Builder Name Generation**: Creates unique names for nested type builders
 * - **Mock Value Extraction**: Finds examples of nested types from mock data
 * - **Type Traversal**: Recursively searches through complex data structures
 * - **GraphQL Type Identification**: Uses `__typename` fields for type detection
 * - **Data Structure Navigation**: Handles arrays, objects, and nested combinations
 *
 * ## Nested Type Strategy:
 *
 * When processing GraphQL operations with nested types, this handler:
 * 1. Identifies objects with `__typename` fields
 * 2. Extracts representative mock values for each type
 * 3. Generates unique builder names scoped to the operation
 * 4. Enables type reuse across different parts of the operation
 *
 * @example Builder Name Generation
 * ```typescript
 * const handler = new NestedTypeHandler();
 *
 * const builderName = handler.generateNestedBuilderName('GetUserProfile', 'User');
 * // Result: 'aGetUserProfileUser'
 *
 * const profileBuilderName = handler.generateNestedBuilderName('GetUserProfile', 'Profile');
 * // Result: 'aGetUserProfileProfile'
 * ```
 *
 * @example Mock Value Extraction
 * ```typescript
 * const mockData = [
 *   {
 *     mockName: 'getUserProfile',
 *     mockValue: {
 *       user: {
 *         __typename: 'User',
 *         id: '123',
 *         name: 'John',
 *         profile: {
 *           __typename: 'Profile',
 *           bio: 'Software developer',
 *           avatar: 'url'
 *         }
 *       }
 *     }
 *   }
 * ];
 *
 * const nestedTypeInfo = { typeName: 'User', ... };
 * const userMock = handler.extractNestedMockValue(mockData, nestedTypeInfo);
 * // Result: { __typename: 'User', id: '123', name: 'John', profile: {...} }
 * ```
 */
export class NestedTypeHandler {
    /**
     * Generates a builder name for a nested type.
     *
     * @param operationName - The operation name
     * @param typeName - The GraphQL type name
     * @returns A unique builder name for the nested type
     */
    generateNestedBuilderName(operationName: string, typeName: string): string {
        return `a${operationName}${typeName}`;
    }

    /**
     * Extracts mock value for a nested type from the mock data objects.
     *
     * @param mockDataObjects - The mock data objects to search
     * @param nestedTypeInfo - The nested type information
     * @returns The mock value for the nested type, if found
     */
    extractNestedMockValue(
        mockDataObjects: MockDataVariants,
        nestedTypeInfo: NestedTypeInfo,
    ): unknown {
        // Search through mock data objects to find an example of this nested type
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
}
