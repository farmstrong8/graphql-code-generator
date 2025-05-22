import {
    FragmentDefinitionNode,
    GraphQLSchema,
    isInterfaceType,
    isObjectType,
} from "graphql";
import { MockArtifact } from "./types";
import { buildMockObject } from "./buildMockObject";
import { buildMockCode } from "./buildMockCode";
import { TypeScriptMockDataPluginConfig } from "./config";

export const processFragmentDefinition = (
    fragment: FragmentDefinitionNode,
    schema: GraphQLSchema,
    config: TypeScriptMockDataPluginConfig,
): MockArtifact[] => {
    const fragmentName = fragment.name.value;
    const typeName = fragment.typeCondition.name.value;

    const type = schema.getType(typeName);
    if (!type || !(isObjectType(type) || isInterfaceType(type))) return [];

    const mocks = buildMockObject({
        schema,
        parentType: type,
        selectionSet: fragment.selectionSet,
        config,
        nameHint: fragmentName,
    });

    return mocks.map(({ name, mockObject }) => ({
        operationName: name,
        operationType: "fragment",
        code: buildMockCode({
            operationName: name,
            operationType: "fragment",
            mockObject,
        }),
    }));
};
