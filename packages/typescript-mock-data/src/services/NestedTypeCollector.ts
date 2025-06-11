import type {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLInterfaceType,
    SelectionSetNode,
    FieldNode,
    FragmentDefinitionNode,
} from "graphql";
import {
    isObjectType,
    isInterfaceType,
    isUnionType,
    isListType,
    getNamedType,
    Kind,
} from "graphql";
import type { MockDataVariants, MockDataObject } from "../types";

/**
 * Information about a reusable nested type.
 */
export interface NestedTypeInfo {
    /** The GraphQL type name */
    typeName: string;
    /** A generated name for the builder function */
    builderName: string;
    /** The selection set that defines this type usage */
    selectionSet: SelectionSetNode;
    /** The GraphQL object type */
    graphqlType: GraphQLObjectType | GraphQLInterfaceType;
    /** How many times this type pattern appears */
    usageCount: number;
}

/**
 * Parameters for collecting nested types from a selection set.
 */
export interface CollectionParams {
    parentType: GraphQLObjectType | GraphQLInterfaceType;
    selectionSet: SelectionSetNode;
    operationName: string;
    fragmentRegistry: Map<string, FragmentDefinitionNode>;
    visitedTypes?: Set<string>;
}

/**
 * Service responsible for identifying and collecting reusable nested types
 * that should have their own builder functions generated.
 *
 * This service analyzes GraphQL selection sets to find complex nested objects
 * that appear multiple times or would benefit from having dedicated builders.
 */
export class NestedTypeCollector {
    private readonly typePatterns = new Map<string, NestedTypeInfo>();
    private readonly fieldPathCounts = new Map<string, number>();

    constructor(private readonly schema: GraphQLSchema) {}

    /**
     * Collects all nested types from mock data variants that should have builders.
     *
     * @param mockVariants - The mock data variants to analyze
     * @returns Array of nested type information for builder generation
     */
    collectFromMockVariants(mockVariants: MockDataVariants): NestedTypeInfo[] {
        this.resetState();

        for (const mockData of mockVariants) {
            this.analyzeOperationMock(mockData);
        }

        return this.getReusableTypes();
    }

    /**
     * Collects nested types from a specific selection set context.
     *
     * @param params - Collection parameters
     * @returns Array of nested type information
     */
    collectFromSelectionSet(params: CollectionParams): NestedTypeInfo[] {
        this.resetState();
        this.analyzeSelectionSet(params);
        return this.getReusableTypes();
    }

    /**
     * Analyzes a single operation mock to identify nested types.
     *
     * @param mockData - The mock data object to analyze
     */
    private analyzeOperationMock(mockData: MockDataObject): void {
        // Extract operation information from mock data
        // This is a simplified version - in a full implementation, we'd need
        // to track the original GraphQL operation information
        this.traverseMockValue(mockData.mockValue, "");
    }

    /**
     * Recursively traverses mock values to identify object patterns.
     *
     * @param value - The mock value to traverse
     * @param path - The current path in the object tree
     */
    private traverseMockValue(value: unknown, path: string): void {
        if (value === null || value === undefined) {
            return;
        }

        if (Array.isArray(value)) {
            value.forEach((item, index) => {
                this.traverseMockValue(item, `${path}[${index}]`);
            });
            return;
        }

        if (typeof value === "object") {
            const obj = value as Record<string, unknown>;
            const typeName = obj.__typename as string;

            if (typeName) {
                // Track this type usage
                const typeKey = this.generateTypeKey(typeName, obj);
                this.recordTypeUsage(typeKey, typeName, path);
            }

            // Recursively analyze nested objects
            for (const [key, nestedValue] of Object.entries(obj)) {
                if (key !== "__typename") {
                    this.traverseMockValue(nestedValue, `${path}.${key}`);
                }
            }
        }
    }

    /**
     * Analyzes a GraphQL selection set to identify nested types.
     *
     * @param params - The analysis parameters
     */
    private analyzeSelectionSet(params: CollectionParams): void {
        const { parentType, selectionSet, visitedTypes = new Set() } = params;
        const fields = parentType.getFields();

        for (const selection of selectionSet.selections) {
            if (selection.kind === Kind.FIELD) {
                const fieldName = selection.name.value;
                const fieldDef = fields[fieldName];

                if (!fieldDef || !selection.selectionSet) {
                    continue;
                }

                const fieldType = getNamedType(fieldDef.type);

                if (isObjectType(fieldType) || isInterfaceType(fieldType)) {
                    const typeName = fieldType.name;

                    // Avoid infinite recursion
                    if (visitedTypes.has(typeName)) {
                        continue;
                    }

                    // Record this nested type
                    const typeKey = this.generateSelectionKey(
                        typeName,
                        selection.selectionSet,
                    );
                    this.recordNestedType(
                        typeKey,
                        typeName,
                        fieldType,
                        selection.selectionSet,
                    );

                    // Recursively analyze nested selections
                    const newVisitedTypes = new Set(visitedTypes);
                    newVisitedTypes.add(typeName);

                    this.analyzeSelectionSet({
                        ...params,
                        parentType: fieldType,
                        selectionSet: selection.selectionSet,
                        visitedTypes: newVisitedTypes,
                    });
                }
            }
        }
    }

    /**
     * Generates a unique key for a type usage pattern.
     *
     * @param typeName - The GraphQL type name
     * @param obj - The object instance
     * @returns A unique key representing this type pattern
     */
    private generateTypeKey(
        typeName: string,
        obj: Record<string, unknown>,
    ): string {
        // Generate a key based on the structure, not the values
        const fields = Object.keys(obj)
            .filter((key) => key !== "__typename")
            .sort();
        return `${typeName}:${fields.join(",")}`;
    }

    /**
     * Generates a unique key for a selection set pattern.
     *
     * @param typeName - The GraphQL type name
     * @param selectionSet - The selection set
     * @returns A unique key representing this selection pattern
     */
    private generateSelectionKey(
        typeName: string,
        selectionSet: SelectionSetNode,
    ): string {
        const fields = selectionSet.selections
            .filter((selection) => selection.kind === Kind.FIELD)
            .map((selection) => (selection as FieldNode).name.value)
            .sort();
        return `${typeName}:${fields.join(",")}`;
    }

    /**
     * Records a type usage for frequency tracking.
     *
     * @param typeKey - The unique type key
     * @param typeName - The GraphQL type name
     * @param path - The path where this type was found
     */
    private recordTypeUsage(
        typeKey: string,
        typeName: string,
        path: string,
    ): void {
        const current = this.fieldPathCounts.get(typeKey) || 0;
        this.fieldPathCounts.set(typeKey, current + 1);
    }

    /**
     * Records a nested type for potential builder generation.
     *
     * @param typeKey - The unique type key
     * @param typeName - The GraphQL type name
     * @param graphqlType - The GraphQL type definition
     * @param selectionSet - The selection set
     */
    private recordNestedType(
        typeKey: string,
        typeName: string,
        graphqlType: GraphQLObjectType | GraphQLInterfaceType,
        selectionSet: SelectionSetNode,
    ): void {
        const existing = this.typePatterns.get(typeKey);

        if (existing) {
            existing.usageCount++;
        } else {
            this.typePatterns.set(typeKey, {
                typeName,
                builderName: this.generateBuilderName(typeName),
                selectionSet,
                graphqlType,
                usageCount: 1,
            });
        }
    }

    /**
     * Generates a builder function name from a GraphQL type name.
     *
     * @param typeName - The GraphQL type name
     * @returns A suitable builder function name
     */
    private generateBuilderName(typeName: string): string {
        return `a${typeName}`;
    }

    /**
     * Returns types that should have reusable builders generated.
     *
     * @returns Array of nested type information
     */
    private getReusableTypes(): NestedTypeInfo[] {
        return Array.from(this.typePatterns.values())
            .filter((typeInfo) => this.shouldGenerateBuilder(typeInfo))
            .sort((a, b) => a.typeName.localeCompare(b.typeName));
    }

    /**
     * Determines if a type should have a builder generated.
     *
     * @param typeInfo - The type information to evaluate
     * @returns True if a builder should be generated
     */
    private shouldGenerateBuilder(typeInfo: NestedTypeInfo): boolean {
        // Generate builders for types that are used multiple times
        // or are complex enough to warrant a builder
        return typeInfo.usageCount > 1 || this.isComplexType(typeInfo);
    }

    /**
     * Determines if a type is complex enough to warrant its own builder.
     *
     * @param typeInfo - The type information to evaluate
     * @returns True if the type is considered complex
     */
    private isComplexType(typeInfo: NestedTypeInfo): boolean {
        // Consider a type complex if it has multiple fields or nested objects
        const fieldCount = typeInfo.selectionSet.selections.filter(
            (selection) => selection.kind === Kind.FIELD,
        ).length;

        return fieldCount >= 3; // Threshold for complexity
    }

    /**
     * Resets the internal state for a new analysis.
     */
    private resetState(): void {
        this.typePatterns.clear();
        this.fieldPathCounts.clear();
    }
}
