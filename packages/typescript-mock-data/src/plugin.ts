import type { PluginFunction } from "@graphql-codegen/plugin-helpers";
import type { TypeScriptMockDataPluginConfig } from "./config";

import { processDocument } from "./processDocument";
import { MOCK_BUILDER_BOILERPLATE } from "./constants";

export const plugin: PluginFunction<TypeScriptMockDataPluginConfig> = (
    schema,
    documents,
    config,
): string => {
    const allMocks: string[] = [];

    for (const doc of documents) {
        if (!doc.document) continue;
        const artifacts = processDocument(doc.document, schema, config);
        for (const { code } of artifacts) {
            allMocks.push(code);
        }
    }

    return [MOCK_BUILDER_BOILERPLATE, ...allMocks].join("\n\n");
};
