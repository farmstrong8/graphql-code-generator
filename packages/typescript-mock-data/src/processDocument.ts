import { type DocumentNode, GraphQLSchema } from "graphql";

import { TypeScriptMockDataPluginConfig } from "./config";
import { MockArtifact } from "./types";
import { processOperationDefinition } from "./processOperationDefinition";
import { processFragmentDefinition } from "./processFragmentDefinition";

export function processDocument(
    document: DocumentNode,
    schema: GraphQLSchema,
    config: TypeScriptMockDataPluginConfig,
): MockArtifact[] {
    const artifacts: MockArtifact[] = [];

    for (const definition of document.definitions) {
        switch (definition.kind) {
            case "OperationDefinition":
                artifacts.push(
                    ...processOperationDefinition(definition, schema, config),
                );
                break;

            case "FragmentDefinition":
                artifacts.push(
                    ...processFragmentDefinition(definition, schema, config),
                );
                break;

            default:
                continue;
        }
    }

    return artifacts;
}
