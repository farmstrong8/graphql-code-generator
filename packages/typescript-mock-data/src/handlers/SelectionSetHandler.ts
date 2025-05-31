import type {
    GraphQLSchema,
    SelectionSetNode,
    FragmentDefinitionNode,
} from "graphql";

/**
 * Handles resolution and processing of GraphQL selection sets.
 *
 * This handler manages fragment spreading, inline fragments, and selection set
 * resolution, providing a clean interface for working with complex GraphQL selections.
 */
export class SelectionSetHandler {
    constructor(private readonly schema: GraphQLSchema) {}

    /**
     * Resolves a selection set by expanding fragments and inline fragments.
     *
     * @param selectionSet - The selection set to resolve
     * @param fragmentRegistry - Available fragment definitions
     * @returns Resolved selection set with all fragments expanded
     */
    resolveSelectionSet(
        selectionSet: SelectionSetNode,
        fragmentRegistry: Map<string, FragmentDefinitionNode>,
    ): SelectionSetNode {
        // This will contain the logic from resolveSelectionSetWithFragments.ts
        // For now, return the original selection set
        // TODO: Implement fragment resolution logic
        return selectionSet;
    }

    /**
     * Extracts fragment definitions from a document and builds a registry.
     *
     * @param fragments - Array of fragment definitions
     * @returns Map of fragment name to fragment definition
     */
    buildFragmentRegistry(
        fragments: FragmentDefinitionNode[],
    ): Map<string, FragmentDefinitionNode> {
        const registry = new Map<string, FragmentDefinitionNode>();

        for (const fragment of fragments) {
            registry.set(fragment.name.value, fragment);
        }

        return registry;
    }

    /**
     * Checks if a selection set contains inline fragments.
     *
     * @param selectionSet - The selection set to check
     * @returns True if inline fragments are present
     */
    hasInlineFragments(selectionSet: SelectionSetNode): boolean {
        return selectionSet.selections.some(
            (selection) => selection.kind === "InlineFragment",
        );
    }
}
