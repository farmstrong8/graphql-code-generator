import { GraphQLSchema, isObjectType, OperationDefinitionNode } from "graphql";
import { TypeScriptMockDataPluginConfig } from "./config";
import { MockArtifact } from "./types";
import { getRootType } from "./utils";
import { buildMockObject } from "./buildMockObject";
import { buildMockCode } from "./buildMockCode";

export const processOperationDefinition = (
    operation: OperationDefinitionNode,
    schema: GraphQLSchema,
    config: TypeScriptMockDataPluginConfig,
): MockArtifact[] => {
    const operationName = operation.name?.value;
    if (!operationName) return [];

    const operationType = operation.operation;
    const rootType = getRootType(schema, operationType);
    if (!rootType || !isObjectType(rootType)) return [];

    const mocks = buildMockObject({
        schema,
        parentType: rootType,
        selectionSet: operation.selectionSet,
        config,
        nameHint: operationName,
    });

    return mocks.map(({ name, mockObject }) => ({
        operationName: name,
        operationType,
        code: buildMockCode({
            operationName: name,
            operationType,
            mockObject,
        }),
    }));
};
