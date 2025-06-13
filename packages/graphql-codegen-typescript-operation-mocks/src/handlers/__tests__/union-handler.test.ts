import { describe, it, expect, beforeEach } from "vitest";
import {
    buildSchema,
    Kind,
    FragmentDefinitionNode,
    OperationDefinitionNode,
    FieldNode,
    InlineFragmentNode,
    SelectionSetNode,
} from "graphql";
import { parse } from "graphql";
import { MockObjectBuilder } from "../../builders/MockObjectBuilder";
import { ScalarHandler } from "../ScalarHandler";
import { SelectionSetHandler } from "../SelectionSetHandler";
import { PluginConfig } from "../../config/PluginConfig";

describe("MockObjectBuilder Union Handling", () => {
    let mockObjectBuilder: MockObjectBuilder;
    let schema: any;
    let scalarHandler: ScalarHandler;
    let selectionSetHandler: SelectionSetHandler;
    let fragmentRegistry: Map<string, FragmentDefinitionNode>;

    beforeEach(() => {
        schema = buildSchema(`
      union SearchResult = User | Post | Comment

      type User {
        id: ID!
        name: String!
        email: String!
      }

      type Post {
        id: ID!
        title: String!
        content: String!
        author: User!
      }

      type Comment {
        id: ID!
        text: String!
        author: User!
        post: Post!
      }

      type Query {
        search(term: String!): [SearchResult!]!
      }
    `);

        fragmentRegistry = new Map();
        scalarHandler = new ScalarHandler(new PluginConfig({}));
        selectionSetHandler = new SelectionSetHandler(schema);
        mockObjectBuilder = new MockObjectBuilder(
            schema,
            scalarHandler,
            selectionSetHandler,
        );
    });

    describe("union type processing", () => {
        it("should process union type with inline fragments", () => {
            const query = parse(`
        query SearchQuery {
          search(term: "test") {
            ... on User {
              id
              name
              email
            }
            ... on Post {
              id
              title
              content
            }
          }
        }
      `);

            const unionType = schema.getType("SearchResult");
            const searchField = (
                query.definitions[0] as OperationDefinitionNode
            ).selectionSet!.selections[0] as FieldNode;
            const selectionSet = searchField.selectionSet!;

            const result = mockObjectBuilder.buildForType(
                unionType,
                selectionSet,
                "SearchQuery",
                fragmentRegistry,
            );

            expect(result).toHaveLength(2);
            expect(result[0].mockName).toBe("SearchQueryAsUser");
            expect(result[1].mockName).toBe("SearchQueryAsPost");

            // Check that the mock values contain the expected fields
            expect(result[0].mockValue).toHaveProperty("id");
            expect(result[0].mockValue).toHaveProperty("name");
            expect(result[0].mockValue).toHaveProperty("email");

            expect(result[1].mockValue).toHaveProperty("id");
            expect(result[1].mockValue).toHaveProperty("title");
            expect(result[1].mockValue).toHaveProperty("content");
        });

        it("should handle empty selection set", () => {
            const unionType = schema.getType("SearchResult");
            const selectionSet: SelectionSetNode = {
                kind: Kind.SELECTION_SET,
                selections: [],
            };

            const result = mockObjectBuilder.buildForType(
                unionType,
                selectionSet,
                "EmptyQuery",
                fragmentRegistry,
            );

            expect(result).toHaveLength(0);
        });

        it("should ignore non-inline fragment selections", () => {
            const query = parse(`
        query SearchQuery {
          search(term: "test") {
            id  # This should be ignored since it's not an inline fragment
            ... on User {
              name
            }
          }
        }
      `);

            const unionType = schema.getType("SearchResult");
            const searchField = (
                query.definitions[0] as OperationDefinitionNode
            ).selectionSet!.selections[0] as FieldNode;
            const selectionSet = searchField.selectionSet!;

            const result = mockObjectBuilder.buildForType(
                unionType,
                selectionSet,
                "SearchQuery",
                fragmentRegistry,
            );

            // Should only process the inline fragment, ignoring the 'id' field
            expect(result).toHaveLength(1);
            expect(result[0].mockName).toBe("SearchQueryAsUser");
        });

        it("should handle multiple variants of the same type", () => {
            const query = parse(`
        query SearchQuery {
          search(term: "test") {
            ... on User {
              id
              name
            }
            ... on User {
              id
              email
            }
          }
        }
      `);

            const unionType = schema.getType("SearchResult");
            const searchField = (
                query.definitions[0] as OperationDefinitionNode
            ).selectionSet!.selections[0] as FieldNode;
            const selectionSet = searchField.selectionSet!;

            const result = mockObjectBuilder.buildForType(
                unionType,
                selectionSet,
                "SearchQuery",
                fragmentRegistry,
            );

            // Should create two variants even though they're both User types
            expect(result).toHaveLength(2);
            expect(result[0].mockName).toBe("SearchQueryAsUser");
            expect(result[1].mockName).toBe("SearchQueryAsUser");
        });
    });

    describe("inline fragment error handling", () => {
        it("should handle inline fragment with no type condition", () => {
            // Create a malformed inline fragment without type condition
            const selectionSet: SelectionSetNode = {
                kind: Kind.SELECTION_SET,
                selections: [
                    {
                        kind: Kind.INLINE_FRAGMENT,
                        selectionSet: {
                            kind: Kind.SELECTION_SET,
                            selections: [],
                        },
                        // Missing typeCondition
                    } as InlineFragmentNode,
                ],
            };

            const unionType = schema.getType("SearchResult");

            const result = mockObjectBuilder.buildForType(
                unionType,
                selectionSet,
                "TestQuery",
                fragmentRegistry,
            );

            expect(result).toHaveLength(0);
        });

        it("should handle inline fragment with non-existent type", () => {
            const query = parse(`
        query SearchQuery {
          search(term: "test") {
            ... on NonExistentType {
              id
            }
          }
        }
      `);

            const unionType = schema.getType("SearchResult");
            const searchField = (
                query.definitions[0] as OperationDefinitionNode
            ).selectionSet!.selections[0] as FieldNode;
            const selectionSet = searchField.selectionSet!;

            const result = mockObjectBuilder.buildForType(
                unionType,
                selectionSet,
                "SearchQuery",
                fragmentRegistry,
            );

            expect(result).toHaveLength(0);
        });

        it("should handle inline fragment with type not in union", () => {
            // Create a schema where Comment is not part of SearchResult
            const restrictedSchema = buildSchema(`
        union SearchResult = User | Post

        type User {
          id: ID!
          name: String!
        }

        type Post {
          id: ID!
          title: String!
        }

        type Comment {
          id: ID!
          text: String!
        }

        type Query {
          search(term: String!): [SearchResult!]!
        }
      `);

            const restrictedMockBuilder = new MockObjectBuilder(
                restrictedSchema,
                scalarHandler,
                selectionSetHandler,
            );

            const query = parse(`
        query SearchQuery {
          search(term: "test") {
            ... on Comment {
              id
              text
            }
          }
        }
      `);

            const unionType = restrictedSchema.getType("SearchResult") as any;
            const searchField = (
                query.definitions[0] as OperationDefinitionNode
            ).selectionSet!.selections[0] as FieldNode;
            const selectionSet = searchField.selectionSet!;

            const result = restrictedMockBuilder.buildForType(
                unionType,
                selectionSet,
                "SearchQuery",
                fragmentRegistry,
            );

            expect(result).toHaveLength(0);
        });
    });

    describe("type checking", () => {
        it("should handle union types correctly", () => {
            const unionType = schema.getType("SearchResult");
            const userType = schema.getType("User");
            const stringType = schema.getType("String");

            // Test that union processing works
            const query = parse(`
        query TestQuery {
          test {
            ... on User { id }
          }
        }
      `);

            const selectionSet: SelectionSetNode = {
                kind: Kind.SELECTION_SET,
                selections: [
                    {
                        kind: Kind.INLINE_FRAGMENT,
                        typeCondition: {
                            kind: Kind.NAMED_TYPE,
                            name: { kind: Kind.NAME, value: "User" },
                        },
                        selectionSet: {
                            kind: Kind.SELECTION_SET,
                            selections: [
                                {
                                    kind: Kind.FIELD,
                                    name: { kind: Kind.NAME, value: "id" },
                                },
                            ],
                        },
                    },
                ],
            };

            const unionResult = mockObjectBuilder.buildForType(
                unionType,
                selectionSet,
                "TestQuery",
                fragmentRegistry,
            );

            const objectResult = mockObjectBuilder.buildForType(
                userType,
                selectionSet,
                "TestQuery",
                fragmentRegistry,
            );

            // Union should produce variants, object should produce single result
            expect(unionResult).toHaveLength(1);
            expect(unionResult[0].mockName).toBe("TestQueryAsUser");

            expect(objectResult).toHaveLength(1);
            expect(objectResult[0].mockName).toBe("TestQuery");
        });
    });
});
