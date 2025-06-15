import { describe, it, expect, beforeEach } from "vitest";
import { buildSchema, parse, Kind } from "graphql";
import { UnionMockService } from "../UnionMockService";
import type { SelectionSetNode } from "graphql";

describe("UnionMockService", () => {
    let schema: any;
    let unionMockService: UnionMockService;

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

            type Todo {
                id: ID!
                title: String!
                completed: Boolean!
            }

            type Query {
                search(term: String!): [SearchResult!]!
            }
        `);

        unionMockService = new UnionMockService(schema);
    });

    describe("processUnionType", () => {
        it("should process union type with multiple inline fragments", () => {
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

            const operation = query.definitions[0] as any;
            const searchField = operation.selectionSet.selections[0];
            const selectionSet = searchField.selectionSet;
            const unionType = schema.getType("SearchResult");

            const result = unionMockService.processUnionType({
                unionType,
                selectionSet,
                operationName: "SearchQuery",
                operationType: "query",
                fragmentRegistry: new Map(),
            });

            expect(result).toHaveLength(2);
            expect(result[0].mockName).toBe("SearchQueryAsUser");
            expect(result[0].mockValue.__typename).toBe("User");
            expect(result[1].mockName).toBe("SearchQueryAsPost");
            expect(result[1].mockValue.__typename).toBe("Post");
        });

        it("should handle single inline fragment", () => {
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

            const operation = query.definitions[0] as any;
            const searchField = operation.selectionSet.selections[0];
            const selectionSet = searchField.selectionSet;
            const unionType = schema.getType("SearchResult");

            const result = unionMockService.processUnionType({
                unionType,
                selectionSet,
                operationName: "SearchQuery",
                operationType: "query",
                fragmentRegistry: new Map(),
            });

            expect(result).toHaveLength(1);
            expect(result[0].mockName).toBe("SearchQueryAsUser");
            expect(result[0].mockValue.__typename).toBe("User");
        });

        it("should handle empty selection set", () => {
            const selectionSet: SelectionSetNode = {
                kind: Kind.SELECTION_SET,
                selections: [],
            };

            const unionType = schema.getType("SearchResult");

            const result = unionMockService.processUnionType({
                unionType,
                selectionSet,
                operationName: "EmptyQuery",
                operationType: "query",
                fragmentRegistry: new Map(),
            });

            expect(result).toHaveLength(0);
        });

        it("should ignore non-inline fragment selections", () => {
            const query = parse(`
                query SearchQuery {
                    search(term: "test") {
                        id
                        ... on User {
                            name
                        }
                    }
                }
            `);

            const operation = query.definitions[0] as any;
            const searchField = operation.selectionSet.selections[0];
            const selectionSet = searchField.selectionSet;
            const unionType = schema.getType("SearchResult");

            const result = unionMockService.processUnionType({
                unionType,
                selectionSet,
                operationName: "SearchQuery",
                operationType: "query",
                fragmentRegistry: new Map(),
            });

            // Should only process the inline fragment, ignoring the 'id' field
            expect(result).toHaveLength(1);
            expect(result[0].mockName).toBe("SearchQueryAsUser");
        });

        it("should handle multiple fragments of the same type", () => {
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

            const operation = query.definitions[0] as any;
            const searchField = operation.selectionSet.selections[0];
            const selectionSet = searchField.selectionSet;
            const unionType = schema.getType("SearchResult");

            const result = unionMockService.processUnionType({
                unionType,
                selectionSet,
                operationName: "SearchQuery",
                operationType: "query",
                fragmentRegistry: new Map(),
            });

            // Should create two variants even though they're both User types
            expect(result).toHaveLength(2);
            expect(result[0].mockName).toBe("SearchQueryAsUser");
            expect(result[1].mockName).toBe("SearchQueryAsUser");
        });
    });

    describe("processInlineFragment", () => {
        it("should handle valid inline fragment", () => {
            const query = parse(`
                fragment TestFragment on User {
                    id
                    name
                }
            `);

            const inlineFragment = {
                kind: Kind.INLINE_FRAGMENT,
                typeCondition: {
                    kind: Kind.NAMED_TYPE,
                    name: { kind: Kind.NAME, value: "User" },
                },
                selectionSet: {
                    kind: Kind.SELECTION_SET,
                    selections: [],
                },
            } as any;

            const unionType = schema.getType("SearchResult");

            const result = unionMockService.processInlineFragment({
                inlineFragment,
                unionType,
                operationName: "TestQuery",
                operationType: "query",
                fragmentRegistry: new Map(),
            });

            expect(result).toHaveLength(1);
            expect(result![0].mockName).toBe("TestQueryAsUser");
            expect(result![0].mockValue.__typename).toBe("User");
        });

        it("should handle inline fragment with missing type condition", () => {
            const inlineFragment = {
                kind: Kind.INLINE_FRAGMENT,
                selectionSet: {
                    kind: Kind.SELECTION_SET,
                    selections: [],
                },
                // Missing typeCondition
            } as any;

            const unionType = schema.getType("SearchResult");

            const result = unionMockService.processInlineFragment({
                inlineFragment,
                unionType,
                operationName: "TestQuery",
                operationType: "query",
                fragmentRegistry: new Map(),
            });

            expect(result).toBeNull();
        });

        it("should handle inline fragment with non-existent type", () => {
            const inlineFragment = {
                kind: Kind.INLINE_FRAGMENT,
                typeCondition: {
                    kind: Kind.NAMED_TYPE,
                    name: { kind: Kind.NAME, value: "NonExistentType" },
                },
                selectionSet: {
                    kind: Kind.SELECTION_SET,
                    selections: [],
                },
            } as any;

            const unionType = schema.getType("SearchResult");

            const result = unionMockService.processInlineFragment({
                inlineFragment,
                unionType,
                operationName: "TestQuery",
                operationType: "query",
                fragmentRegistry: new Map(),
            });

            expect(result).toBeNull();
        });

        it("should handle inline fragment with type not in union", () => {
            const inlineFragment = {
                kind: Kind.INLINE_FRAGMENT,
                typeCondition: {
                    kind: Kind.NAMED_TYPE,
                    name: { kind: Kind.NAME, value: "Todo" },
                },
                selectionSet: {
                    kind: Kind.SELECTION_SET,
                    selections: [],
                },
            } as any;

            const unionType = schema.getType("SearchResult");

            const result = unionMockService.processInlineFragment({
                inlineFragment,
                unionType,
                operationName: "TestQuery",
                operationType: "query",
                fragmentRegistry: new Map(),
            });

            expect(result).toBeNull();
        });
    });

    describe("findUnionFields", () => {
        it("should find fields that return union types", () => {
            const queryType = schema.getType("Query");
            const selectionSet: SelectionSetNode = {
                kind: Kind.SELECTION_SET,
                selections: [
                    {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: "search" },
                        selectionSet: {
                            kind: Kind.SELECTION_SET,
                            selections: [],
                        },
                    },
                ],
            };

            const result = unionMockService.findUnionFields(
                queryType,
                selectionSet,
            );

            expect(result).toHaveLength(1);
            expect(result[0].name.value).toBe("search");
        });

        it("should ignore fields without selection sets", () => {
            const queryType = schema.getType("Query");
            const selectionSet: SelectionSetNode = {
                kind: Kind.SELECTION_SET,
                selections: [
                    {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: "search" },
                        // Missing selectionSet
                    },
                ],
            };

            const result = unionMockService.findUnionFields(
                queryType,
                selectionSet,
            );

            expect(result).toHaveLength(0);
        });

        it("should ignore non-union fields", () => {
            const userType = schema.getType("User");
            const selectionSet: SelectionSetNode = {
                kind: Kind.SELECTION_SET,
                selections: [
                    {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: "name" },
                    },
                ],
            };

            const result = unionMockService.findUnionFields(
                userType,
                selectionSet,
            );

            expect(result).toHaveLength(0);
        });
    });

    describe("utility methods", () => {
        it("should generate variant names correctly", () => {
            const result = unionMockService.generateVariantName(
                "SearchQuery",
                "query",
                "User",
            );

            expect(result).toBe("SearchQueryAsUser");
        });

        it("should detect inline fragments correctly", () => {
            const selectionSetWithFragments: SelectionSetNode = {
                kind: Kind.SELECTION_SET,
                selections: [
                    {
                        kind: Kind.INLINE_FRAGMENT,
                        selectionSet: {
                            kind: Kind.SELECTION_SET,
                            selections: [],
                        },
                    } as any,
                ],
            };

            const selectionSetWithoutFragments: SelectionSetNode = {
                kind: Kind.SELECTION_SET,
                selections: [
                    {
                        kind: Kind.FIELD,
                        name: { kind: Kind.NAME, value: "id" },
                    },
                ],
            };

            expect(
                unionMockService.hasInlineFragments(selectionSetWithFragments),
            ).toBe(true);
            expect(
                unionMockService.hasInlineFragments(
                    selectionSetWithoutFragments,
                ),
            ).toBe(false);
        });
    });
});
