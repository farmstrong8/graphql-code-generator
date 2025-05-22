import {
    GraphQLSchema,
    SelectionSetNode,
    isScalarType,
    isObjectType,
    isInterfaceType,
    isListType,
    isUnionType,
    getNamedType,
    type GraphQLCompositeType,
    type GraphQLObjectType,
    GraphQLUnionType,
} from "graphql";

import type { NamedMock } from "./types";
import type { TypeScriptMockDataPluginConfig } from "./config";
import { generateScalarMock } from "./generateScalarMock";

export function buildMockObject({
    schema,
    parentType,
    selectionSet,
    config,
    nameHint,
}: {
    schema: GraphQLSchema;
    parentType: GraphQLCompositeType;
    selectionSet: SelectionSetNode;
    config: TypeScriptMockDataPluginConfig;
    nameHint: string; // e.g., operationName or fieldName
}): NamedMock[] {
    if (isUnionType(parentType)) {
        return handleUnionWithInlineFragments({
            schema,
            unionType: parentType,
            selectionSet,
            config,
            nameHint,
            fieldName: nameHint, // this is just for naming, so operation name is fine
        });
    }

    const result: Record<string, unknown> = {
        __typename: parentType.name,
    };

    const fields = parentType.getFields();
    const extraMocks: NamedMock[] = [];

    for (const selection of selectionSet.selections) {
        if (selection.kind !== "Field") continue;

        const fieldName = selection.name.value;
        const fieldDef = fields[fieldName];
        if (!fieldDef) continue;

        const fieldType = fieldDef.type;
        const namedType = getNamedType(fieldType);
        const isList = isListType(fieldType);

        let value: unknown;

        if (isScalarType(namedType)) {
            value = generateScalarMock(namedType.name, config);
        } else if (
            (isObjectType(namedType) || isInterfaceType(namedType)) &&
            selection.selectionSet
        ) {
            const nested = buildMockObject({
                schema,
                parentType: namedType,
                selectionSet: selection.selectionSet,
                config,
                nameHint: fieldName,
            })[0];
            value = nested?.mockObject ?? null;
        } else if (isUnionType(namedType) && selection.selectionSet) {
            const unionMocks = handleUnionWithInlineFragments({
                schema,
                unionType: namedType,
                selectionSet: selection.selectionSet,
                config,
                nameHint,
                fieldName,
            });

            for (const mock of unionMocks) {
                extraMocks.push({
                    name: mock.name,
                    typeName: parentType.name,
                    mockObject: {
                        ...result,
                        [fieldName]: mock.mockObject,
                    },
                });
            }

            continue; // skip setting `result[fieldName]` — handled by extra mocks
        } else {
            value = null;
        }

        result[fieldName] = isList ? [value] : value;
    }

    const hasFields = Object.keys(result).some((key) => key !== "__typename");

    return hasFields
        ? [
              { name: nameHint, typeName: parentType.name, mockObject: result },
              ...extraMocks,
          ]
        : extraMocks;
}

function handleUnionWithInlineFragments({
    schema,
    unionType,
    selectionSet,
    config,
    nameHint, // 👈 this should be the operation name like "TodoDetailsPageQuery"
}: {
    schema: GraphQLSchema;
    unionType: GraphQLUnionType;
    selectionSet: SelectionSetNode;
    config: TypeScriptMockDataPluginConfig;
    nameHint: string;
    fieldName: string;
}): NamedMock[] {
    const mocks: NamedMock[] = [];

    for (const selection of selectionSet.selections) {
        if (selection.kind !== "InlineFragment") continue;

        const typeConditionName = selection.typeCondition?.name.value;
        const matchingType = unionType
            .getTypes()
            .find((t) => t.name === typeConditionName);
        if (!matchingType || !selection.selectionSet) continue;

        const fragmentMocks = buildMockObject({
            schema,
            parentType: matchingType,
            selectionSet: selection.selectionSet,
            config,
            nameHint: `${nameHint}As${matchingType.name}`, // ✅ clean mock name like TodoDetailsPageQueryAsTodo
        });

        for (const mock of fragmentMocks) {
            mocks.push({
                name: mock.name, // this becomes e.g. TodoDetailsPageQueryAsTodo
                typeName: unionType.name,
                mockObject: mock.mockObject,
            });
        }
    }

    return mocks;
}
