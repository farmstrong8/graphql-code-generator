import type {
    GraphQLObjectType,
    GraphQLInterfaceType,
    GraphQLEnumType,
    SelectionSetNode,
    FragmentDefinitionNode,
    GraphQLSchema,
} from "graphql";
import type { ScalarHandler } from "../handlers/ScalarHandler";
import type {
    SchemaAnalysisService,
    FieldAnalysisInfo,
} from "./SchemaAnalysisService";
import {
    isScalarType,
    isEnumType,
    getNamedType,
    isUnionType,
    Kind,
    isObjectType,
} from "graphql";

/**
 * Options for value generation
 */
export interface ValueGenerationOptions {
    /** Map of type names to builder functions for nested objects */
    nestedBuilders?: Map<string, string>;
    /** Whether to wrap list values in arrays */
    wrapListValues?: boolean;
    /** Maximum depth for nested object generation */
    maxDepth?: number;
}

/**
 * Value Generation Service
 *
 * This is a focused, atomic service that only generates mock values.
 * It has a single responsibility and is easily testable.
 *
 * Responsibilities:
 * - Generate scalar values using ScalarHandler
 * - Generate enum values using ScalarHandler
 * - Generate object values from field analysis
 * - Handle list wrapping
 * - Reference nested builders when available
 *
 * What it does NOT do:
 * - Analyze schemas (uses SchemaAnalysisService)
 * - Generate TypeScript types
 * - Handle naming conventions
 * - Generate builder code
 */
export class ValueGenerationService {
    constructor(
        private readonly scalarHandler: ScalarHandler,
        private readonly schemaAnalysisService: SchemaAnalysisService,
        private readonly schema: GraphQLSchema,
    ) {}

    /**
     * Generates a complete mock object from schema analysis.
     * This is the main entry point for value generation.
     */
    generateMockObject(
        parentType: GraphQLObjectType | GraphQLInterfaceType,
        selectionSet: SelectionSetNode,
        fragmentRegistry: Map<string, FragmentDefinitionNode>,
        options: ValueGenerationOptions = {},
    ): Record<string, unknown> {
        // Use SchemaAnalysisService for structured analysis
        const analysis = this.schemaAnalysisService.analyzeSelectionSet(
            parentType,
            selectionSet,
            fragmentRegistry,
        );

        const mockValue: Record<string, unknown> = {
            __typename: parentType.name,
        };

        // Generate values for each field
        for (const fieldInfo of analysis.fields) {
            mockValue[fieldInfo.name] = this.generateFieldValue(
                fieldInfo,
                fragmentRegistry,
                options,
            );
        }

        return mockValue;
    }

    /**
     * Generates a value for a specific field.
     * Uses the field analysis to determine the appropriate generation strategy.
     */
    generateFieldValue(
        fieldInfo: FieldAnalysisInfo,
        fragmentRegistry: Map<string, FragmentDefinitionNode>,
        options: ValueGenerationOptions = {},
    ): unknown {
        const { fieldDef, selection, nestedType } = fieldInfo;
        const fieldType = fieldDef.type;
        const namedType = getNamedType(fieldType);
        const isList = this.schemaAnalysisService.isFieldList(fieldDef);

        const getValue = (): unknown => {
            // Handle scalar types using ScalarHandler
            if (isScalarType(namedType)) {
                return this.scalarHandler.generateMockValue(namedType.name);
            }

            // Handle enum types using ScalarHandler
            if (isEnumType(namedType)) {
                const enumValues = namedType
                    .getValues()
                    .map((value) => value.name);
                return this.scalarHandler.generateEnumValue(enumValues);
            }

            // Handle union types
            if (isUnionType(namedType) && selection.selectionSet) {
                return this.generateUnionValue(
                    selection.selectionSet,
                    fragmentRegistry,
                    options,
                );
            }

            // Handle nested object types
            if (nestedType && selection.selectionSet) {
                // Always generate the actual nested object
                // BuilderCodeService will substitute the builder reference
                // if a nested builder is available in its nestedBuilders map
                return this.generateMockObject(
                    nestedType,
                    selection.selectionSet,
                    fragmentRegistry,
                    options,
                );
            }

            // Default to null for unknown types
            return null;
        };

        const value = getValue();

        // Wrap in array if this is a list type
        if (isList && options.wrapListValues !== false) {
            return [value];
        }

        return value;
    }

    /**
     * Generates a scalar value.
     * Simple delegation to ScalarHandler for easy testing.
     */
    generateScalarValue(scalarTypeName: string): unknown {
        return this.scalarHandler.generateMockValue(scalarTypeName);
    }

    /**
     * Generates a value for a union type by using the first inline fragment.
     * This provides a default union variant for the main builder.
     * Uses schema-driven field analysis instead of heuristics.
     */
    generateUnionValue(
        selectionSet: SelectionSetNode,
        fragmentRegistry: Map<string, FragmentDefinitionNode>,
        options: ValueGenerationOptions = {},
    ): unknown {
        // Find the first inline fragment in the selection set
        for (const selection of selectionSet.selections) {
            if (
                selection.kind === Kind.INLINE_FRAGMENT &&
                selection.typeCondition
            ) {
                const targetTypeName = selection.typeCondition.name.value;
                const targetType = this.schema.getType(targetTypeName);

                // Validate that the target type exists and is an object type
                if (!targetType || !isObjectType(targetType)) {
                    continue;
                }

                // Use schema analysis to properly generate field values
                return this.generateMockObject(
                    targetType,
                    selection.selectionSet,
                    fragmentRegistry,
                    options,
                );
            }
        }

        // Fallback to null if no inline fragments found
        return null;
    }

    /**
     * Checks if a value should be treated as a builder reference.
     * Simple utility method that's easily testable.
     */
    isBuilderReference(value: unknown): boolean {
        return (
            typeof value === "object" &&
            value !== null &&
            "__builderReference" in (value as Record<string, unknown>)
        );
    }

    /**
     * Extracts the builder name from a builder reference value.
     * Returns null if the value is not a valid builder reference.
     */
    getBuilderNameFromReference(value: unknown): string | null {
        if (!this.isBuilderReference(value)) {
            return null;
        }

        const ref = value as Record<string, unknown>;
        return typeof ref.__builderReference === "string"
            ? ref.__builderReference
            : null;
    }

    /**
     * Validates that a generated value matches the expected type.
     * Returns an array of validation errors (empty if valid).
     */
    validateGeneratedValue(value: unknown, expectedTypeName: string): string[] {
        const errors: string[] = [];

        // Basic type validation
        if (value === null || value === undefined) {
            // Null/undefined are generally acceptable for nullable fields
            return errors;
        }

        // For objects, check __typename if present
        if (typeof value === "object" && value !== null) {
            const obj = value as Record<string, unknown>;
            if (obj.__typename && obj.__typename !== expectedTypeName) {
                errors.push(
                    `Expected __typename "${expectedTypeName}", got "${obj.__typename}"`,
                );
            }
        }

        return errors;
    }
}
