import {
    type DocumentNode,
    GraphQLSchema,
    type OperationDefinitionNode,
    isObjectType,
} from "graphql";

import { buildMockObject } from "./buildMockObject";
import { buildMockCode } from "./buildMockCode";

export interface MockArtifact {
    operationName: string;
    operationType: "query" | "mutation" | "subscription";
    code: string;
}

export function processDocument(
    document: DocumentNode,
    schema: GraphQLSchema,
): MockArtifact[] {
    const artifacts: MockArtifact[] = [];

    for (const definition of document.definitions) {
        if (definition.kind !== "OperationDefinition") continue;

        const operation = definition as OperationDefinitionNode;
        const operationName = operation.name?.value;
        if (!operationName) continue;

        const operationType = operation.operation;
        const rootType = getRootType(schema, operationType);
        if (!rootType || !isObjectType(rootType)) continue;

        const mockObject = buildMockObject({
            schema,
            parentType: rootType,
            selectionSet: operation.selectionSet,
        });

        const code = buildMockCode({
            operationName,
            mockObject,
            operationType,
        });

        artifacts.push({
            operationName,
            operationType,
            code,
        });
    }

    return artifacts;
}

function getRootType(
    schema: GraphQLSchema,
    op: "query" | "mutation" | "subscription",
) {
    switch (op) {
        case "query":
            return schema.getQueryType();
        case "mutation":
            return schema.getMutationType();
        case "subscription":
            return schema.getSubscriptionType();
    }
}
