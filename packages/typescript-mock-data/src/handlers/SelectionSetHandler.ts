import type {
    GraphQLSchema,
    SelectionSetNode,
    FragmentDefinitionNode,
    SelectionNode,
    FieldNode,
    InlineFragmentNode,
    FragmentSpreadNode,
} from "graphql";
import { Kind } from "graphql";

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
        const resolvedSelections: SelectionNode[] = [];

        for (const selection of selectionSet.selections) {
            if (selection.kind === Kind.FRAGMENT_SPREAD) {
                // Handle fragment spreads (e.g., ...AuthorFragment)
                const resolvedFragment = this.resolveFragmentSpread(
                    selection,
                    fragmentRegistry,
                );
                if (resolvedFragment) {
                    resolvedSelections.push(...resolvedFragment.selections);
                } else {
                    // If fragment cannot be resolved, skip it (this happens in collocation mode)
                    // We could log a warning here if needed
                    continue;
                }
            } else if (selection.kind === Kind.INLINE_FRAGMENT) {
                // Handle inline fragments (e.g., ... on Todo { ... })
                const resolvedInlineFragment = this.resolveInlineFragment(
                    selection,
                    fragmentRegistry,
                );
                resolvedSelections.push(resolvedInlineFragment);
            } else if (selection.kind === Kind.FIELD) {
                // Handle regular fields, recursively resolving nested selection sets
                const resolvedField = this.resolveField(
                    selection,
                    fragmentRegistry,
                );
                resolvedSelections.push(resolvedField);
            }
        }

        return {
            ...selectionSet,
            selections: resolvedSelections,
        };
    }

    /**
     * Resolves a fragment spread by looking up the fragment definition.
     *
     * @param fragmentSpread - The fragment spread selection
     * @param fragmentRegistry - Available fragment definitions
     * @returns The fragment's selection set, or null if not found
     */
    private resolveFragmentSpread(
        fragmentSpread: FragmentSpreadNode,
        fragmentRegistry: Map<string, FragmentDefinitionNode>,
    ): SelectionSetNode | null {
        const fragmentName = fragmentSpread.name.value;
        const fragmentDef = fragmentRegistry.get(fragmentName);

        if (!fragmentDef) {
            return null;
        }

        // Recursively resolve the fragment's selection set
        return this.resolveSelectionSet(
            fragmentDef.selectionSet,
            fragmentRegistry,
        );
    }

    /**
     * Resolves an inline fragment by recursively resolving its selection set.
     *
     * @param inlineFragment - The inline fragment selection
     * @param fragmentRegistry - Available fragment definitions
     * @returns The resolved inline fragment
     */
    private resolveInlineFragment(
        inlineFragment: InlineFragmentNode,
        fragmentRegistry: Map<string, FragmentDefinitionNode>,
    ): InlineFragmentNode {
        return {
            ...inlineFragment,
            selectionSet: this.resolveSelectionSet(
                inlineFragment.selectionSet,
                fragmentRegistry,
            ),
        };
    }

    /**
     * Resolves a field by recursively resolving its nested selection set if present.
     *
     * @param field - The field selection
     * @param fragmentRegistry - Available fragment definitions
     * @returns The resolved field
     */
    private resolveField(
        field: FieldNode,
        fragmentRegistry: Map<string, FragmentDefinitionNode>,
    ): FieldNode {
        if (!field.selectionSet) {
            return field;
        }

        return {
            ...field,
            selectionSet: this.resolveSelectionSet(
                field.selectionSet,
                fragmentRegistry,
            ),
        };
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
            (selection) => selection.kind === Kind.INLINE_FRAGMENT,
        );
    }

    /**
     * Checks if a selection set contains fragment spreads.
     *
     * @param selectionSet - The selection set to check
     * @returns True if fragment spreads are present
     */
    hasFragmentSpreads(selectionSet: SelectionSetNode): boolean {
        return selectionSet.selections.some(
            (selection) => selection.kind === Kind.FRAGMENT_SPREAD,
        );
    }
}
