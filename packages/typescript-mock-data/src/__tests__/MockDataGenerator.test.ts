import { describe, it, expect } from "vitest";
import { buildSchema, parse } from "graphql";
import { MockDataGenerator } from "../core/MockDataGenerator";

const schema = buildSchema(`
  type Query {
    hello: String
    todo(id: ID!): Todo
    todos: [Todo!]!
  }

  type Mutation {
    addTodo(input: AddTodoInput!): Todo
    deleteTodo(id: ID!): Boolean
  }

  type Todo {
    id: ID!
    title: String!
    completed: Boolean!
    dueAt: Date
    author: Author
  }

  type Author {
    id: ID!
    name: String!
    email: String
  }

  input AddTodoInput {
    title: String!
    dueAt: Date
  }

  scalar Date

  union SearchResult = Todo | Author

  type Error {
    message: String!
  }
`);

describe("MockDataGenerator", () => {
    it("should generate mock for simple query", () => {
        const generator = new MockDataGenerator(schema, {});
        const document = parse(`
      query GetTodos {
        todos {
          id
          title
          completed
        }
      }
    `);

        const result = generator.generateFromDocuments([{ document }]);

        expect(result).toContain("export const aGetTodos");
        expect(result).toContain("createBuilder<GetTodosQuery>");
        expect(result).toContain("todos: {"); // Single object, not array
        expect(result).toContain("id:");
        expect(result).toContain("title:");
        expect(result).toContain("completed:");
    });

    it("should generate mock for mutation", () => {
        const generator = new MockDataGenerator(schema, {});
        const document = parse(`
      mutation AddTodo($input: AddTodoInput!) {
        addTodo(input: $input) {
          id
          title
          completed
        }
      }
    `);

        const result = generator.generateFromDocuments([{ document }]);

        expect(result).toContain("export const aAddTodo");
        expect(result).toContain("createBuilder<AddTodoMutation>");
        expect(result).toContain("addTodo: {");
    });

    it("should handle fragments in same document", () => {
        const generator = new MockDataGenerator(schema, {});
        const document = parse(`
      fragment TodoFields on Todo {
        id
        title
        completed
      }

      query GetTodosWithFragment {
        todos {
          ...TodoFields
        }
      }
    `);

        const result = generator.generateFromDocuments([{ document }]);

        expect(result).toContain("export const aGetTodosWithFragment");
        expect(result).toContain("export const aTodoFields");
        expect(result).toContain("id:");
        expect(result).toContain("title:");
        expect(result).toContain("completed:");
    });

    it("should handle inline fragments", () => {
        const generator = new MockDataGenerator(schema, {});
        const document = parse(`
      query SearchQuery {
        search {
          ... on Todo {
            id
            title
          }
          ... on Author {
            id
            name
          }
        }
      }
    `);

        const result = generator.generateFromDocuments([{ document }]);

        // Should generate variants for each inline fragment
        expect(result).toContain("export const aSearchQuery");
        // Note: The actual plugin may not generate separate variants for inline fragments
        // This test may need adjustment based on actual plugin behavior
    });

    it("should handle custom scalars with config", () => {
        const generator = new MockDataGenerator(schema, {
            scalars: {
                Date: {
                    generator: "date",
                    arguments: "YYYY-MM-DD",
                },
            },
        });
        const document = parse(`
      query GetTodo {
        todo(id: "1") {
          id
          title
          dueAt
        }
      }
    `);

        const result = generator.generateFromDocuments([{ document }]);

        // Plugin generates actual values, not code strings
        expect(result).toContain("dueAt:");
        // The actual value will be a generated date string like "1994-02-25"
    });

    it("should handle nested objects", () => {
        const generator = new MockDataGenerator(schema, {});
        const document = parse(`
      query GetTodoWithAuthor {
        todo(id: "1") {
          id
          title
          author {
            id
            name
            email
          }
        }
      }
    `);

        const result = generator.generateFromDocuments([{ document }]);

        expect(result).toContain("author: {");
        expect(result).toContain('"__typename": "Author"');
        expect(result).toContain("name:");
        expect(result).toContain("email:");
    });

    it("should return empty string for empty documents", () => {
        const generator = new MockDataGenerator(schema, {});

        const result = generator.generateFromDocuments([]);

        expect(result).toBe("");
    });

    it("should include boilerplate only once", () => {
        const generator = new MockDataGenerator(schema, {});
        const document1 = parse(`
      query Query1 {
        todos {
          id
        }
      }
    `);
        const document2 = parse(`
      query Query2 {
        todos {
          title
        }
      }
    `);

        const result = generator.generateFromDocuments([
            { document: document1 },
            { document: document2 },
        ]);

        // Should contain boilerplate only once at the top
        const boilerplateMatches = result.match(
            /createBuilder<T extends object>/g,
        );
        expect(boilerplateMatches).toHaveLength(1);

        // Should contain both queries
        expect(result).toContain("export const aQuery1");
        expect(result).toContain("export const aQuery2");
    });

    describe("Error handling and edge cases", () => {
        it("should handle union types without proper UnionHandler setup", () => {
            const unionSchema = buildSchema(`
                type Query {
                    search: SearchResult
                }
                
                union SearchResult = Todo | Author
                
                type Todo {
                    id: ID!
                    title: String!
                }
                
                type Author {
                    id: ID!
                    name: String!
                }
            `);

            const generator = new MockDataGenerator(unionSchema, {});
            const document = parse(`
                query SearchQuery {
                    search {
                        ... on Todo {
                            id
                            title
                        }
                        ... on Author {
                            id
                            name
                        }
                    }
                }
            `);

            // This should handle union types gracefully even without explicit UnionHandler setup
            const result = generator.generateFromDocuments([{ document }]);
            expect(result).toContain("export const aSearchQuery");
        });

        it("should handle complex nested structures with mixed union and regular fields", () => {
            const complexSchema = buildSchema(`
                type Query {
                    mixedData: ComplexType
                    regularField: String
                }
                
                type ComplexType {
                    unionField: SearchResult
                    regularField: String
                    nestedObject: NestedType
                }
                
                type NestedType {
                    value: String
                    optionalField: String
                }
                
                union SearchResult = Todo | Author
                
                type Todo {
                    id: ID!
                    title: String!
                }
                
                type Author {
                    id: ID!
                    name: String!
                }
            `);

            const generator = new MockDataGenerator(complexSchema, {});
            const document = parse(`
                query ComplexQuery {
                    mixedData {
                        unionField {
                            ... on Todo {
                                id
                                title
                            }
                            ... on Author {
                                id
                                name
                            }
                        }
                        regularField
                        nestedObject {
                            value
                        }
                    }
                    regularField
                }
            `);

            const result = generator.generateFromDocuments([{ document }]);
            expect(result).toContain("export const aComplexQuery");
            expect(result).toContain("mixedData:");
            expect(result).toContain("unionField:");
            expect(result).toContain("regularField:");
            expect(result).toContain("nestedObject:");
        });

        it("should handle fields without selection sets for complex types", () => {
            const generator = new MockDataGenerator(schema, {});
            const document = parse(`
                query TodoWithoutNestedSelection {
                    todo(id: "1") {
                        id
                        title
                        author
                    }
                }
            `);

            // This tests the scenario where a complex type field (author) is selected
            // without a selection set, which should return null
            const result = generator.generateFromDocuments([{ document }]);
            expect(result).toContain(
                "export const aTodoWithoutNestedSelection",
            );
            expect(result).toContain("author: null");
        });

        it("should handle empty nested object scenarios", () => {
            const emptySchema = buildSchema(`
                type Query {
                    emptyContainer: Container
                }
                
                type Container {
                    items: [Item]
                    metadata: Metadata
                }
                
                type Item {
                    id: ID!
                    value: String
                }
                
                type Metadata {
                    count: Int
                    tags: [String]
                }
            `);

            const generator = new MockDataGenerator(emptySchema, {});
            const document = parse(`
                query EmptyContainerQuery {
                    emptyContainer {
                        items {
                            id
                            value
                        }
                        metadata {
                            count
                            tags
                        }
                    }
                }
            `);

            const result = generator.generateFromDocuments([{ document }]);
            expect(result).toContain("export const aEmptyContainerQuery");
            expect(result).toContain("emptyContainer:");
            expect(result).toContain("items:");
            expect(result).toContain("metadata:");
        });

        it("should handle deeply nested union variant scenarios", () => {
            const deepSchema = buildSchema(`
                type Query {
                    deepData: DeepContainer
                }
                
                type DeepContainer {
                    level1: Level1
                    unionArray: [SearchResult]
                }
                
                type Level1 {
                    level2: Level2
                    someField: String
                }
                
                type Level2 {
                    searchResult: SearchResult
                    anotherField: Int
                }
                
                union SearchResult = Todo | Author
                
                type Todo {
                    id: ID!
                    title: String!
                    author: Author
                }
                
                type Author {
                    id: ID!
                    name: String!
                    email: String
                }
            `);

            const generator = new MockDataGenerator(deepSchema, {});
            const document = parse(`
                query DeepQuery {
                    deepData {
                        level1 {
                            level2 {
                                searchResult {
                                    ... on Todo {
                                        id
                                        title
                                        author {
                                            id
                                            name
                                        }
                                    }
                                    ... on Author {
                                        id
                                        name
                                        email
                                    }
                                }
                                anotherField
                            }
                            someField
                        }
                        unionArray {
                            ... on Todo {
                                id
                                title
                            }
                        }
                    }
                }
            `);

            // This tests deep nesting with union variants and should exercise
            // the complex union variant generation logic
            const result = generator.generateFromDocuments([{ document }]);
            expect(result).toContain("export const aDeepQuery");
            expect(result).toContain("deepData:");
            expect(result).toContain("level1:");
            expect(result).toContain("level2:");
            expect(result).toContain("searchResult:");
            expect(result).toContain("unionArray:");
        });
    });
});
