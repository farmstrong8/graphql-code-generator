import type {
    GraphQLObjectType,
    GraphQLInterfaceType,
    SelectionSetNode,
    FragmentDefinitionNode,
} from "graphql";
import type { ScalarHandler } from "../handlers/ScalarHandler";
import type {
    SchemaAnalysisService,
    FieldAnalysisInfo,
} from "./SchemaAnalysisService";
import { isScalarType, getNamedType, isUnionType, Kind } from "graphql";

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

                // Get the target type from the schema (we need access to schema here)
                // For now, create a simple mock object with the typename
                const mockValue: Record<string, unknown> = {
                    __typename: targetTypeName,
                };

                // Generate values for fields in this inline fragment
                if (selection.selectionSet) {
                    for (const fragmentSelection of selection.selectionSet
                        .selections) {
                        if (fragmentSelection.kind === Kind.FIELD) {
                            const fieldName = fragmentSelection.name.value;
                            // Generate a simple scalar value for now
                            // This could be enhanced to use proper field analysis
                            mockValue[fieldName] =
                                this.generateDefaultValueForField(fieldName);
                        }
                    }
                }

                return mockValue;
            }
        }

        // Fallback to null if no inline fragments found
        return null;
    }

    /**
     * Generates a default value for a field based on its name.
     * This is a simple heuristic-based approach.
     */
    private generateDefaultValueForField(fieldName: string): unknown {
        switch (fieldName) {
            case "id":
                return this.scalarHandler.generateMockValue("ID");
            case "title":
            case "name":
            case "message":
                return this.scalarHandler.generateMockValue("String");
            case "completed":
                return this.scalarHandler.generateMockValue("Boolean");
            default:
                return this.scalarHandler.generateMockValue("String");
        }
    }

    /**
     * Checks if a value should be treated as a builder reference.
     * Simple utility method that's easily testable.
     */
    isBuilderReference(value: unknown): boolean {
        return (
            typeof value === "object" &&
            value !== null &&
            "__useBuilder" in (value as Record<string, unknown>)
        );
    }

    /**
     * Extracts the builder name from a builder reference.
     * Simple utility method that's easily testable.
     */
    getBuilderNameFromReference(value: unknown): string | null {
        if (this.isBuilderReference(value)) {
            const obj = value as Record<string, unknown>;
            const builderName = obj.__useBuilder;
            return typeof builderName === "string" ? builderName : null;
        }
        return null;
    }

    /**
     * Validates generated values against expected structure.
     * Returns validation errors if any.
     */
    validateGeneratedValue(value: unknown, expectedTypeName: string): string[] {
        const errors: string[] = [];

        if (typeof value !== "object" || value === null) {
            errors.push(`Expected object but got ${typeof value}`);
            return errors;
        }

        const obj = value as Record<string, unknown>;

        // Check __typename
        if (obj.__typename !== expectedTypeName) {
            errors.push(
                `Expected __typename "${expectedTypeName}" but got "${obj.__typename}"`,
            );
        }

        return errors;
    }
}
