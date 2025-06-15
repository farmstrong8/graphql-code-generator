import type {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLInterfaceType,
    GraphQLField,
    SelectionSetNode,
    FieldNode,
    FragmentDefinitionNode,
} from "graphql";
import { isObjectType, isInterfaceType, getNamedType, Kind } from "graphql";

/**
 * Information about a field in the schema analysis
 */
export interface FieldAnalysisInfo {
    /** Field name */
    name: string;
    /** GraphQL field definition */
    fieldDef: GraphQLField<any, any>;
    /** Field selection from query */
    selection: FieldNode;
    /** Whether this field has nested selections */
    hasNestedSelection: boolean;
    /** If nested, what type it resolves to */
    nestedType?: GraphQLObjectType | GraphQLInterfaceType;
}

/**
 * Complete analysis of a selection set
 */
export interface SelectionSetAnalysis {
    /** The parent type being analyzed */
    parentType: GraphQLObjectType | GraphQLInterfaceType;
    /** All fields in the selection */
    fields: FieldAnalysisInfo[];
    /** Nested object fields that need their own builders */
    nestedObjectFields: FieldAnalysisInfo[];
    /** Simple scalar/primitive fields */
    scalarFields: FieldAnalysisInfo[];
}

/**
 * Schema Analysis Service
 *
 * This is a focused, atomic service that only analyzes GraphQL schemas.
 * It has a single responsibility and is easily testable.
 *
 * Responsibilities:
 * - Parse selection sets
 * - Identify field types
 * - Categorize fields (scalar vs object)
 * - Return structured analysis data
 *
 * What it does NOT do:
 * - Generate TypeScript code
 * - Generate mock values
 * - Handle naming conventions
 */
export class SchemaAnalysisService {
    constructor(private readonly schema: GraphQLSchema) {}

    /**
     * Analyzes a selection set and returns structured information.
     * This is the main entry point for schema analysis.
     */
    analyzeSelectionSet(
        parentType: GraphQLObjectType | GraphQLInterfaceType,
        selectionSet: SelectionSetNode,
        fragmentRegistry: Map<string, FragmentDefinitionNode>,
    ): SelectionSetAnalysis {
        const fields: FieldAnalysisInfo[] = [];
        const nestedObjectFields: FieldAnalysisInfo[] = [];
        const scalarFields: FieldAnalysisInfo[] = [];

        // Analyze each field in the selection set (fragments should already be resolved)
        for (const selection of selectionSet.selections) {
            if (selection.kind === Kind.FIELD) {
                const fieldInfo = this.analyzeField(
                    parentType,
                    selection,
                    fragmentRegistry,
                );

                if (fieldInfo) {
                    fields.push(fieldInfo);

                    if (fieldInfo.hasNestedSelection && fieldInfo.nestedType) {
                        nestedObjectFields.push(fieldInfo);
                    } else {
                        scalarFields.push(fieldInfo);
                    }
                }
            }
        }

        return {
            parentType,
            fields,
            nestedObjectFields,
            scalarFields,
        };
    }

    /**
     * Analyzes a single field selection.
     * Returns structured information about the field.
     */
    analyzeField(
        parentType: GraphQLObjectType | GraphQLInterfaceType,
        selection: FieldNode,
        fragmentRegistry: Map<string, FragmentDefinitionNode>,
    ): FieldAnalysisInfo | null {
        const fieldName = selection.name.value;
        const fieldDef = parentType.getFields()[fieldName];

        if (!fieldDef) {
            return null; // Field doesn't exist on this type
        }

        const hasNestedSelection = !!selection.selectionSet;
        let nestedType: GraphQLObjectType | GraphQLInterfaceType | undefined;

        if (hasNestedSelection) {
            const fieldType = getNamedType(fieldDef.type);
            if (isObjectType(fieldType) || isInterfaceType(fieldType)) {
                nestedType = fieldType;
            }
        }

        return {
            name: fieldName,
            fieldDef,
            selection,
            hasNestedSelection,
            nestedType,
        };
    }

    /**
     * Checks if a field represents a list type.
     * Simple utility method that's easily testable.
     */
    isFieldList(fieldDef: GraphQLField<any, any>): boolean {
        const type = fieldDef.type;
        return (
            type.toString().includes("[") || type.toString().includes("List")
        );
    }

    /**
     * Checks if a field is nullable.
     * Simple utility method that's easily testable.
     */
    isFieldNullable(fieldDef: GraphQLField<any, any>): boolean {
        return !fieldDef.type.toString().includes("!");
    }

    /**
     * Gets the GraphQL type name for a field.
     * Simple utility method that's easily testable.
     */
    getFieldTypeName(fieldDef: GraphQLField<any, any>): string {
        const namedType = getNamedType(fieldDef.type);
        return namedType.name;
    }

    /**
     * Validates that a selection set is compatible with the parent type.
     * Returns validation errors if any.
     */
    validateSelectionSet(
        parentType: GraphQLObjectType | GraphQLInterfaceType,
        selectionSet: SelectionSetNode,
    ): string[] {
        const errors: string[] = [];
        const availableFields = Object.keys(parentType.getFields());

        for (const selection of selectionSet.selections) {
            if (selection.kind === Kind.FIELD) {
                const fieldName = selection.name.value;
                if (!availableFields.includes(fieldName)) {
                    errors.push(
                        `Field "${fieldName}" does not exist on type "${parentType.name}"`,
                    );
                }
            }
        }

        return errors;
    }
}
