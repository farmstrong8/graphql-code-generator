import type {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLInterfaceType,
    SelectionSetNode,
    FieldNode,
    FragmentDefinitionNode,
} from "graphql";
import { isObjectType, isInterfaceType, getNamedType, Kind } from "graphql";

/**
 * Information about a nested type that needs its own builder.
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
    /** The hierarchical path to this nested type */
    path: string;
    /** The operation-specific type name (e.g., "TodoQueryAuthor") */
    operationTypeName: string;
    /** The depth level in the hierarchy (for recursion protection) */
    depth: number;
}

/**
 * Parameters for collecting nested types from a selection set.
 */
export interface CollectionParams {
    parentType: GraphQLObjectType | GraphQLInterfaceType;
    selectionSet: SelectionSetNode;
    operationName: string;
    fragmentRegistry: Map<string, FragmentDefinitionNode>;
    currentPath?: string;
    currentDepth?: number;
}

/**
 * Configuration for recursion handling.
 */
export interface RecursionConfig {
    /** Maximum depth to traverse before stopping recursion */
    maxDepth: number;
    /** Whether to create builders for recursive types at max depth */
    createBuildersAtMaxDepth: boolean;
}

/**
 * Service responsible for analyzing and managing nested types in GraphQL operations.
 *
 * This service creates a builder for every nested object type in the query hierarchy,
 * enabling clean composition where each nested object has its own reusable builder function.
 *
 * Key features:
 * - Path-based naming: Same type in different contexts gets different builders
 * - Recursion protection: Prevents infinite loops with configurable depth limits
 * - Context-aware: Generates meaningful names based on the hierarchical path
 */
export class NestedTypeService {
    private readonly nestedTypes: NestedTypeInfo[] = [];
    private readonly recursionConfig: RecursionConfig;
    private readonly visitedPaths = new Set<string>();

    constructor(
        private readonly schema: GraphQLSchema,
        recursionConfig: Partial<RecursionConfig> = {},
    ) {
        this.recursionConfig = {
            maxDepth: 5, // Reasonable default to prevent infinite recursion
            createBuildersAtMaxDepth: true, // Still create builders at max depth
            ...recursionConfig,
        };
    }

    /**
     * Analyzes a selection set to identify all nested types that need builders.
     * This creates a builder for every nested object type in the hierarchy.
     *
     * @param params - Analysis parameters
     * @returns Array of nested type information
     */
    analyzeSelectionSet(params: CollectionParams): NestedTypeInfo[] {
        this.resetAnalysisState();
        this.traverseSelectionSet({
            ...params,
            currentPath: params.currentPath || "",
            currentDepth: params.currentDepth || 0,
        });
        return [...this.nestedTypes];
    }

    /**
     * Generates a type name for a nested type based on its path context.
     *
     * @param operationName - The operation name
     * @param path - The hierarchical path (e.g., "todo.author.address")
     * @param typeName - The GraphQL type name
     * @returns Context-aware type name (e.g., "TodoQueryTodoAuthorAddress")
     */
    generateTypeName(
        operationName: string,
        path: string,
        typeName: string,
    ): string {
        const pathParts = path
            .split(".")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1));
        return `${operationName}${pathParts.join("")}`;
    }

    /**
     * Generates a builder name for a nested type (with "a" prefix).
     *
     * @param operationName - The operation name
     * @param path - The hierarchical path
     * @param typeName - The GraphQL type name
     * @returns Builder name (e.g., "aTodoQueryTodoAuthorAddress")
     */
    generateBuilderName(
        operationName: string,
        path: string,
        typeName: string,
    ): string {
        return `a${this.generateTypeName(operationName, path, typeName)}`;
    }

    /**
     * Gets the current recursion configuration.
     */
    getRecursionConfig(): RecursionConfig {
        return { ...this.recursionConfig };
    }

    /**
     * Analyzes a GraphQL selection set to identify nested types.
     * This creates a builder for every nested object type found.
     */
    private traverseSelectionSet(params: CollectionParams): void {
        const {
            parentType,
            selectionSet,
            operationName,
            fragmentRegistry,
            currentPath = "",
            currentDepth = 0,
        } = params;

        // Check recursion depth
        if (currentDepth >= this.recursionConfig.maxDepth) {
            return;
        }

        // Check for circular paths to prevent infinite recursion
        const pathKey = `${parentType.name}:${currentPath}:${currentDepth}`;
        if (this.visitedPaths.has(pathKey)) {
            return;
        }
        this.visitedPaths.add(pathKey);

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
                    const fieldPath = currentPath
                        ? `${currentPath}.${fieldName}`
                        : fieldName;

                    // Create a nested type for this object
                    const operationTypeName = this.generateTypeName(
                        operationName,
                        fieldPath,
                        typeName,
                    );
                    const builderName = this.generateBuilderName(
                        operationName,
                        fieldPath,
                        typeName,
                    );

                    // Only create builder if we haven't hit max depth or if configured to create at max depth
                    if (
                        currentDepth < this.recursionConfig.maxDepth - 1 ||
                        this.recursionConfig.createBuildersAtMaxDepth
                    ) {
                        this.nestedTypes.push({
                            typeName,
                            builderName,
                            selectionSet: selection.selectionSet,
                            graphqlType: fieldType,
                            path: fieldPath,
                            operationTypeName,
                            depth: currentDepth + 1,
                        });
                    }

                    // Recursively analyze nested selections (with depth check)
                    if (currentDepth + 1 < this.recursionConfig.maxDepth) {
                        this.traverseSelectionSet({
                            parentType: fieldType,
                            selectionSet: selection.selectionSet,
                            operationName,
                            fragmentRegistry,
                            currentPath: fieldPath,
                            currentDepth: currentDepth + 1,
                        });
                    }
                }
            }
        }
    }

    /**
     * Resets analysis state for a new analysis run.
     */
    private resetAnalysisState(): void {
        this.nestedTypes.length = 0;
        this.visitedPaths.clear();
    }
}
