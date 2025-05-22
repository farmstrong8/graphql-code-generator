import {
    GraphQLSchema,
    GraphQLObjectType,
    SelectionSetNode,
    isScalarType,
    isObjectType,
    isListType,
    getNamedType,
} from "graphql";

import type { TypeScriptMockDataPluginConfig } from "./config";
import { generateScalarMock } from "./generateScalarMock";

export function buildMockObject({
    schema,
    parentType,
    selectionSet,
    config,
}: {
    schema: GraphQLSchema;
    parentType: GraphQLObjectType;
    selectionSet: SelectionSetNode;
    config: TypeScriptMockDataPluginConfig;
}): Record<string, unknown> {
    const result: Record<string, unknown> = {
        __typename: parentType.name,
    };

    for (const selection of selectionSet.selections) {
        if (selection.kind !== "Field") continue;

        const fieldName = selection.name.value;
        const fieldDef = parentType.getFields?.()[fieldName];
        if (!fieldDef) continue;

        const fieldType = fieldDef.type;
        const namedType = getNamedType(fieldType);
        const isList = isListType(fieldType);

        const getValue = () => {
            if (isScalarType(namedType)) {
                return generateScalarMock(namedType.name, config);
            }
            if (isObjectType(namedType) && selection.selectionSet) {
                return buildMockObject({
                    schema,
                    parentType: namedType,
                    selectionSet: selection.selectionSet,
                    config,
                });
            }
            return null;
        };

        const value = getValue();

        result[fieldName] = isList ? [value] : value;
    }

    return result;
}
