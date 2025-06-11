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
import {
    isObjectType,
    isInterfaceType,
    isScalarType,
    getNamedType,
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
                    // Fragment definition not available (near-operation-file mode)
                    // Create a synthetic field selection based on schema analysis
                    const syntheticFields = this.createSyntheticFragmentFields(
                        selection.name.value,
                        fragmentRegistry,
                    );
                    if (syntheticFields.length > 0) {
                        resolvedSelections.push(...syntheticFields);
                    }
                    // If we can't create synthetic fields, we still skip the fragment
                    // This maintains backward compatibility
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

    /**
     * Creates synthetic field selections for unresolved fragments.
     * This is a fallback for near-operation-file mode where fragments are defined in separate files.
     *
     * @param fragmentName - The name of the fragment (e.g., "AuthorFragment")
     * @param fragmentRegistry - Available fragment definitions (may be incomplete)
     * @returns Array of synthetic field selections
     */
    private createSyntheticFragmentFields(
        fragmentName: string,
        fragmentRegistry: Map<string, FragmentDefinitionNode>,
    ): FieldNode[] {
        // Extract the type name from fragment name (e.g., "AuthorFragment" -> "Author")
        const targetTypeName =
            this.extractTypeNameFromFragmentName(fragmentName);

        if (!targetTypeName) {
            return [];
        }

        // Get the target type from schema
        const targetType = this.schema.getType(targetTypeName);
        if (
            !targetType ||
            (!isObjectType(targetType) && !isInterfaceType(targetType))
        ) {
            return [];
        }

        // Generate common field selections that fragments typically include
        const syntheticFields =
            this.generateCommonFragmentFieldSelections(targetType);

        return syntheticFields;
    }

    /**
     * Extracts the target type name from a fragment name using common naming patterns.
     *
     * @param fragmentName - Fragment name (e.g., "AuthorFragment", "UserFields", "PostDetails")
     * @returns The extracted type name or null if cannot be determined
     */
    private extractTypeNameFromFragmentName(
        fragmentName: string,
    ): string | null {
        // Common patterns:
        // - "AuthorFragment" -> "Author"
        // - "UserFields" -> "User"
        // - "PostDetails" -> "Post"
        // - "TodoInfo" -> "Todo"

        // Remove common fragment suffixes
        const suffixes = [
            "Fragment",
            "Fields",
            "Details",
            "Info",
            "Data",
            "Props",
        ];

        for (const suffix of suffixes) {
            if (fragmentName.endsWith(suffix)) {
                return fragmentName.slice(0, -suffix.length);
            }
        }

        // If no suffix pattern matches, assume the fragment name is the type name
        return fragmentName;
    }

    /**
     * Generates synthetic field selections for common fields that fragments typically include.
     *
     * @param targetType - The GraphQL type to generate field selections for
     * @returns Array of FieldNode selections
     */
    private generateCommonFragmentFieldSelections(
        targetType: any, // GraphQLObjectType | GraphQLInterfaceType
    ): FieldNode[] {
        const fieldSelections: FieldNode[] = [];
        const schemaFields = targetType.getFields();

        // Include common identifier fields that fragments typically use
        const commonFieldNames = [
            "id",
            "name",
            "title",
            "email",
            "username",
            "slug",
        ];

        for (const fieldName of commonFieldNames) {
            const fieldDef = schemaFields[fieldName];
            if (fieldDef) {
                fieldSelections.push({
                    kind: Kind.FIELD,
                    name: {
                        kind: Kind.NAME,
                        value: fieldName,
                    },
                });
            }
        }

        // If we have very few fields so far, include a few more scalar fields
        if (fieldSelections.length < 3) {
            for (const fieldName of Object.keys(schemaFields)) {
                if (
                    fieldSelections.some((sel) => sel.name.value === fieldName)
                ) {
                    continue; // Already included
                }

                const fieldDef = schemaFields[fieldName];
                const namedType = getNamedType(fieldDef.type);
                if (isScalarType(namedType)) {
                    fieldSelections.push({
                        kind: Kind.FIELD,
                        name: {
                            kind: Kind.NAME,
                            value: fieldName,
                        },
                    });

                    // Stop when we have enough fields
                    if (fieldSelections.length >= 3) {
                        break;
                    }
                }
            }
        }

        return fieldSelections;
    }
}
