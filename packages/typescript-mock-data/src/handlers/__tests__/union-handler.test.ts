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
import { UnionHandler } from "../UnionHandler";
import { MockObjectBuilder } from "../../builders/MockObjectBuilder";
import { ScalarHandler } from "../ScalarHandler";
import { SelectionSetHandler } from "../SelectionSetHandler";
import { PluginConfig } from "../../config/PluginConfig";

describe("UnionHandler", () => {
    let handler: UnionHandler;
    let schema: any;
    let mockObjectBuilder: MockObjectBuilder;
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
        handler = new UnionHandler(schema);
        handler.setMockObjectBuilder(mockObjectBuilder);
    });

    describe("setMockObjectBuilder", () => {
        it("should set mock object builder", () => {
            const newHandler = new UnionHandler(schema);
            newHandler.setMockObjectBuilder(mockObjectBuilder);
            expect(newHandler["mockObjectBuilder"]).toBe(mockObjectBuilder);
        });
    });

    describe("processUnionType", () => {
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

            const result = handler.processUnionType({
                unionType,
                selectionSet,
                operationName: "SearchQuery",
                fragmentRegistry,
            });

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

            const result = handler.processUnionType({
                unionType,
                selectionSet,
                operationName: "EmptyQuery",
                fragmentRegistry,
            });

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

            const result = handler.processUnionType({
                unionType,
                selectionSet,
                operationName: "SearchQuery",
                fragmentRegistry,
            });

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

            const result = handler.processUnionType({
                unionType,
                selectionSet,
                operationName: "SearchQuery",
                fragmentRegistry,
            });

            // Should create two variants even though they're both User types
            expect(result).toHaveLength(2);
            expect(result[0].mockName).toBe("SearchQueryAsUser");
            expect(result[1].mockName).toBe("SearchQueryAsUser");
        });
    });

    describe("processInlineFragment (private method tested through processUnionType)", () => {
        it("should return null when inline fragment has no type condition", () => {
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

            const result = handler.processUnionType({
                unionType,
                selectionSet,
                operationName: "TestQuery",
                fragmentRegistry,
            });

            expect(result).toHaveLength(0);
        });

        it("should return null when target type does not exist in schema", () => {
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

            const result = handler.processUnionType({
                unionType,
                selectionSet,
                operationName: "SearchQuery",
                fragmentRegistry,
            });

            expect(result).toHaveLength(0);
        });

        it("should return null when target type is not a member of the union", () => {
            // Add a type that exists but is not part of the SearchResult union
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

            const restrictedHandler = new UnionHandler(restrictedSchema);
            const restrictedMockBuilder = new MockObjectBuilder(
                restrictedSchema,
                scalarHandler,
                selectionSetHandler,
            );
            restrictedHandler.setMockObjectBuilder(restrictedMockBuilder);

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

            const result = restrictedHandler.processUnionType({
                unionType,
                selectionSet,
                operationName: "SearchQuery",
                fragmentRegistry,
            });

            expect(result).toHaveLength(0);
        });

        it("should throw error when MockObjectBuilder is not set", () => {
            const handlerWithoutBuilder = new UnionHandler(schema);
            // Don't set mockObjectBuilder

            const query = parse(`
        query SearchQuery {
          search(term: "test") {
            ... on User {
              id
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

            expect(() => {
                handlerWithoutBuilder.processUnionType({
                    unionType,
                    selectionSet,
                    operationName: "SearchQuery",
                    fragmentRegistry,
                });
            }).toThrow("MockObjectBuilder not set on UnionHandler");
        });
    });

    describe("isUnionType", () => {
        it("should return true for union types", () => {
            const unionType = schema.getType("SearchResult");
            expect(handler.isUnionType(unionType)).toBe(true);
        });

        it("should return false for non-union types", () => {
            const objectType = schema.getType("User");
            expect(handler.isUnionType(objectType)).toBe(false);
        });

        it("should return false for scalar types", () => {
            const scalarType = schema.getType("String");
            expect(handler.isUnionType(scalarType)).toBe(false);
        });

        it("should return false for null/undefined", () => {
            expect(handler.isUnionType(null)).toBe(false);
            expect(handler.isUnionType(undefined)).toBe(false);
        });
    });
});
