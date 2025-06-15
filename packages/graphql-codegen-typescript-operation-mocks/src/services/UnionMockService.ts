import type {
    GraphQLSchema,
    GraphQLUnionType,
    GraphQLObjectType,
    GraphQLInterfaceType,
    SelectionSetNode,
    FieldNode,
    FragmentDefinitionNode,
    InlineFragmentNode,
    GraphQLType,
} from "graphql";
import { Kind, getNamedType, isUnionType, isObjectType } from "graphql";
import type { MockDataVariants } from "../types";
import type { NamingService } from "./NamingService";

/**
 * Parameters for processing union types.
 */
export interface UnionProcessingParams {
    unionType: GraphQLUnionType;
    selectionSet: SelectionSetNode;
    operationName: string;
    operationType: "query" | "mutation" | "subscription" | "fragment";
    fragmentRegistry: Map<string, FragmentDefinitionNode>;
}

/**
 * Parameters for processing inline fragments.
 */
export interface InlineFragmentParams {
    inlineFragment: InlineFragmentNode;
    unionType: GraphQLUnionType;
    operationName: string;
    operationType: "query" | "mutation" | "subscription" | "fragment";
    fragmentRegistry: Map<string, FragmentDefinitionNode>;
}

/**
 * Service responsible for handling GraphQL union type processing and mock generation.
 *
 * This service handles:
 * - Processing union types with inline fragments
 * - Generating mock variants for different union member types
 * - Validating inline fragments against union definitions
 * - Finding union-returning fields in selection sets
 */
export class UnionMockService {
    constructor(
        private readonly schema: GraphQLSchema,
        private readonly namingService?: NamingService,
    ) {}

    /**
     * Processes a union type with inline fragments to generate mock variants.
     *
     * @param params - Union processing parameters
     * @returns Array of mock data variants for each union member type
     */
    processUnionType(params: UnionProcessingParams): MockDataVariants {
        const {
            unionType,
            selectionSet,
            operationName,
            operationType,
            fragmentRegistry,
        } = params;
        const variants: MockDataVariants = [];

        for (const selection of selectionSet.selections) {
            if (selection.kind !== Kind.INLINE_FRAGMENT) continue;

            const variant = this.processInlineFragment({
                inlineFragment: selection,
                unionType,
                operationName,
                operationType,
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
     * @returns Mock data variants for the fragment, or null if processing fails
     */
    processInlineFragment(
        params: InlineFragmentParams,
    ): MockDataVariants | null {
        const { inlineFragment, unionType, operationName, operationType } =
            params;

        // Validate type condition exists
        if (!inlineFragment.typeCondition) {
            return null;
        }

        const targetTypeName = inlineFragment.typeCondition.name.value;
        const targetType = this.schema.getType(targetTypeName);

        // Validate target type exists in schema
        if (!targetType) {
            return null;
        }

        // Validate target type is a valid member of the union
        if (!this.isValidUnionMember(unionType, targetType)) {
            return null;
        }

        // Generate variant name with proper operation suffix placement
        const variantName = this.generateVariantName(
            operationName,
            operationType,
            targetTypeName,
        );

        // Return processing parameters for the variant
        // The actual mock building will be delegated to ObjectMockService
        return [
            {
                mockName: variantName,
                mockValue: {
                    __typename: targetTypeName,
                    // Additional fields will be populated by ObjectMockService
                },
            },
        ];
    }

    /**
     * Finds fields in a selection set that return union types.
     *
     * @param parentType - The parent GraphQL type
     * @param selectionSet - The selection set to analyze
     * @returns Array of fields that return union types
     */
    findUnionFields(
        parentType: GraphQLObjectType | GraphQLInterfaceType,
        selectionSet: SelectionSetNode,
    ): FieldNode[] {
        const unionFields: FieldNode[] = [];

        for (const selection of selectionSet.selections) {
            if (selection.kind !== Kind.FIELD) continue;

            const fieldDef = parentType.getFields()[selection.name.value];
            if (!fieldDef) continue;

            const namedType = getNamedType(fieldDef.type);
            if (isUnionType(namedType) && selection.selectionSet) {
                unionFields.push(selection);
            }
        }

        return unionFields;
    }

    /**
     * Checks if a GraphQL type is a valid member of a union.
     *
     * @param unionType - The union type to check against
     * @param candidateType - The type to validate
     * @returns True if the candidate type is a valid union member
     */
    private isValidUnionMember(
        unionType: GraphQLUnionType,
        candidateType: GraphQLType,
    ): boolean {
        // Union members must be object types
        if (!isObjectType(candidateType)) {
            return false;
        }
        return unionType.getTypes().includes(candidateType);
    }

    /**
     * Generates variant names for union types with proper operation suffix placement.
     *
     * @param operationName - Base operation name
     * @param operationType - The operation type
     * @param typeName - The specific union member type name
     * @returns Generated variant name (e.g., "GetTodoByIdQueryAsTodo")
     */
    generateVariantName(
        operationName: string,
        operationType: "query" | "mutation" | "subscription" | "fragment",
        typeName: string,
    ): string {
        if (this.namingService) {
            // Use naming service to get the proper operation name with suffix
            const operationNameWithSuffix = this.namingService.generateTypeName(
                operationName,
                operationType,
            );
            // Simply append "As{TypeName}" to the operation name with suffix
            return `${operationNameWithSuffix}As${typeName}`;
        }

        // Fallback for backward compatibility
        return `${operationName}As${typeName}`;
    }

    /**
     * Checks if a selection set contains any inline fragments.
     *
     * @param selectionSet - The selection set to check
     * @returns True if inline fragments are present
     */
    hasInlineFragments(selectionSet: SelectionSetNode): boolean {
        return selectionSet.selections.some(
            (selection) => selection.kind === Kind.INLINE_FRAGMENT,
        );
    }
}
