import { describe, it, expect } from "vitest";
import { TypeScriptCodeBuilder } from "../../builders/TypeScriptCodeBuilder";
import { TypeInferenceService } from "../TypeInferenceService";
import { NestedTypeCollector } from "../NestedTypeCollector";
import { buildSchema, parse } from "graphql";

describe("Nested Type Extraction", () => {
    it("should generate correct TodosPageQuery with nested TodosPageTodo type", () => {
        const schema = buildSchema(`
            type Query {
                todos: [Todo!]!
            }
            
            type Todo {
                id: ID!
                title: String!
                completed: Boolean!
                dueAt: String
                author: Author!
            }
            
            type Author {
                id: ID!
                name: String!
            }
        `);

        const document = parse(`
            query TodosPageQuery {
                todos {
                    id
                    title
                    completed
                    dueAt
                    author {
                        __typename
                    }
                }
            }
        `);

        const typeInferenceService = new TypeInferenceService(schema);
        const nestedTypeCollector = new NestedTypeCollector(schema);
        const codeBuilder = new TypeScriptCodeBuilder(
            typeInferenceService,
            nestedTypeCollector,
        );

        const mockDataObjects = [
            {
                mockName: "TodosPageQuery",
                mockValue: {
                    __typename: "Query",
                    todos: [
                        {
                            __typename: "Todo",
                            id: "test-id",
                            title: "Test Todo",
                            completed: false,
                            dueAt: "2025-01-01",
                            author: {
                                __typename: "Author",
                            },
                        },
                    ],
                },
            },
        ];

        const operation = document.definitions[0] as any;
        const schemaContext = {
            parentType: schema.getQueryType()!,
            selectionSet: operation.selectionSet,
            fragmentRegistry: new Map(),
        };

        const result = codeBuilder.buildCodeArtifact(
            "TodosPageQuery",
            "query",
            mockDataObjects,
            schemaContext,
        );

        expect(result.generatedCode).toContain("type TodosPageQueryTodo = {");
        expect(result.generatedCode).toContain('"__typename": "Todo",');
        expect(result.generatedCode).toContain("id: string,");
        expect(result.generatedCode).toContain("title: string,");
        expect(result.generatedCode).toContain("completed: boolean,"); // Should have main type that references nested type
        expect(result.generatedCode).toContain("type TodosPageQuery = {");
        expect(result.generatedCode).toContain('"__typename": "Query",');
        expect(result.generatedCode).toContain(
            "todos: Array<TodosPageQueryTodo>",
        ); // Should have builders that use the nested builder
        expect(result.generatedCode).toContain(
            "export const aTodosPageQueryTodo = createBuilder<TodosPageQueryTodo>(",
        );
        expect(result.generatedCode).toContain(
            "export const aTodosPageQuery = createBuilder<TodosPageQuery>(",
        );
        expect(result.generatedCode).toContain(
            "todos: [aTodosPageQueryTodo()]",
        );

        // Should NOT have broken type definitions
        expect(result.generatedCode).not.toContain(
            "type TodosPageQuery = TodosPageTodo",
        );
        expect(result.generatedCode).not.toContain("}>");
    });
});
