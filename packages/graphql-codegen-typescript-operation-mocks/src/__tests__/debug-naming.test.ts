import { describe, it, expect } from "vitest";
import { buildSchema, parse } from "graphql";
import { PluginOrchestrator } from "../orchestrators/PluginOrchestrator";

describe("Debug Naming Configuration", () => {
    it("should debug naming configuration behavior", () => {
        const schema = buildSchema(`
            type Author {
                id: ID!
                name: String!
            }
        `);

        const documents = [
            {
                document: parse(`
                    fragment AuthorFields on Author {
                        id
                        name
                    }
                `),
            },
        ];

        // Test with suffixes disabled
        const orchestrator = new PluginOrchestrator(schema, {
            naming: {
                addOperationSuffix: false,
            },
        });

        const result = orchestrator.generateFromDocuments(documents);

        // Check what was actually generated
        expect(result).toContain("type AuthorFields = {");
        expect(result).toContain("export const aAuthorFields");
    });
});
