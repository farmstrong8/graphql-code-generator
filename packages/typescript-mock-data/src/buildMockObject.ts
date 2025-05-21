import {
    GraphQLSchema,
    GraphQLObjectType,
    type SelectionSetNode,
    isScalarType,
    isObjectType,
    isListType,
    getNamedType,
} from "graphql";
import casual from "casual";

export function buildMockObject({
    schema,
    parentType,
    selectionSet,
}: {
    schema: GraphQLSchema;
    parentType: GraphQLObjectType;
    selectionSet: SelectionSetNode;
}): object {
    const result: Record<string, any> = {
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

        let value: any;

        if (isScalarType(namedType)) {
            value = getScalarMock(namedType.name);
        } else if (isObjectType(namedType) && selection.selectionSet) {
            value = buildMockObject({
                schema,
                parentType: namedType,
                selectionSet: selection.selectionSet,
            });
        } else {
            value = null;
        }

        result[fieldName] = isList ? [value] : value;
    }

    return result;
}

function getScalarMock(scalarName: string): any {
    switch (scalarName) {
        case "ID":
            return casual.uuid;
        case "String":
            return casual.sentence;
        case "Int":
            return casual.integer();
        case "Float":
            return casual.double();
        case "Boolean":
            return true;
        default:
            return `${scalarName.toLowerCase()}-mock`;
    }
}
