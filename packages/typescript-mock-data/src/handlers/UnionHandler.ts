import type {
    GraphQLSchema,
    GraphQLUnionType,
    SelectionSetNode,
    InlineFragmentNode,
    FragmentDefinitionNode,
} from "graphql";
import { isUnionType, getNamedType, Kind } from "graphql";
import type { MockDataVariants } from "../types";

/**
 * Parameters for processing union types with inline fragments.
 */
export interface ProcessUnionParams {
    unionType: GraphQLUnionType;
    selectionSet: SelectionSetNode;
    operationName: string;
    fragmentRegistry: Map<string, FragmentDefinitionNode>;
}

/**
 * Parameters for processing individual inline fragments.
 */
export interface ProcessInlineFragmentParams {
    inlineFragment: InlineFragmentNode;
    unionType: GraphQLUnionType;
    operationName: string;
    fragmentRegistry: Map<string, FragmentDefinitionNode>;
}

/**
 * Handles union types and inline fragments in GraphQL selections.
 *
 * This handler specializes in processing union types that contain inline fragments,
 * generating separate mock objects for each possible union variant.
 */
export class UnionHandler {
    private mockObjectBuilder: any; // Will be set via dependency injection

    constructor(private readonly schema: GraphQLSchema) {}

    /**
     * Sets the mock object builder dependency (resolves circular dependency).
     *
     * @param builder - The MockObjectBuilder instance
     */
    setMockObjectBuilder(builder: any): void {
        this.mockObjectBuilder = builder;
    }

    /**
     * Processes a union type with inline fragments.
     *
     * @param params - Union processing parameters
     * @returns Mock data objects for each union variant
     */
    processUnionType(params: ProcessUnionParams): MockDataVariants {
        const { unionType, selectionSet, operationName, fragmentRegistry } =
            params;
        const variants: MockDataVariants = [];

        for (const selection of selectionSet.selections) {
            if (selection.kind !== Kind.INLINE_FRAGMENT) continue;

            const variant = this.processInlineFragment({
                inlineFragment: selection,
                unionType,
                operationName,
                fragmentRegistry,
            });

            if (variant) {
                variants.push(...variant);
            }
        }

        return variants;
    }

    /**
     * Processes an individual inline fragment within a union type.
     *
     * @param params - Inline fragment processing parameters
     * @returns Mock data objects for the fragment, or null if processing fails
     */
    private processInlineFragment(
        params: ProcessInlineFragmentParams,
    ): MockDataVariants | null {
        const { inlineFragment, unionType, operationName, fragmentRegistry } =
            params;

        // Get the target type for this inline fragment
        if (!inlineFragment.typeCondition) {
            return null;
        }

        const targetTypeName = inlineFragment.typeCondition.name.value;
        const targetType = this.schema.getType(targetTypeName);

        if (!targetType) {
            return null;
        }

        // Verify the target type is a valid member of the union
        if (!unionType.getTypes().includes(targetType as any)) {
            return null;
        }

        // Generate a variant name that includes the union member type
        const variantName = `${operationName}As${targetTypeName}`;

        // Use the mock object builder to generate the mock for this variant
        if (!this.mockObjectBuilder) {
            throw new Error("MockObjectBuilder not set on UnionHandler");
        }

        return this.mockObjectBuilder.buildForType(
            targetType,
            inlineFragment.selectionSet,
            variantName,
            fragmentRegistry,
        );
    }

    /**
     * Checks if a GraphQL type is a union type.
     *
     * @param type - The GraphQL type to check
     * @returns True if the type is a union type
     */
    isUnionType(type: any): type is GraphQLUnionType {
        return isUnionType(type);
    }
}
