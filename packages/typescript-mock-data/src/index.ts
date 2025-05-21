import type { PluginFunction } from "@graphql-codegen/plugin-helpers";
import type { TypeScriptMockDataPluginConfig } from "./config";
import type { Types } from "@graphql-codegen/plugin-helpers";
import { GraphQLSchema } from "graphql";

import { processDocument } from "./processDocument";
import { MOCK_BUILDER_BOILERPLATE } from "./mockBuilderBoilerplate";

export const plugin: PluginFunction<TypeScriptMockDataPluginConfig> = (
    schema: GraphQLSchema,
    documents: Types.DocumentFile[],
): string => {
    const allMocks: string[] = [];

    for (const doc of documents) {
        if (!doc.document) continue;
        const artifacts = processDocument(doc.document, schema);
        for (const { code } of artifacts) {
            allMocks.push(code);
        }
    }

    return [MOCK_BUILDER_BOILERPLATE, ...allMocks].join("\n\n");
};
