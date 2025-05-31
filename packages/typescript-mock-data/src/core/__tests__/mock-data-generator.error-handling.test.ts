import { describe, it, expect } from "vitest";
import { buildSchema, parse } from "graphql";
import { MockDataGenerator } from "../MockDataGenerator";

const schema = buildSchema(`
  type Query {
    hello: String
    todo(id: ID!): Todo
    todos: [Todo!]!
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

  scalar Date
  union SearchResult = Todo | Author
`);

/**
 * Tests for MockDataGenerator error handling and edge cases.
 *
 * This test suite validates how the generator handles:
 * - Complex nested structures with union types
 * - Missing selection sets
 * - Deeply nested scenarios
 * - Edge cases and malformed queries
 */
describe("MockDataGenerator Error Handling", () => {
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
        expect(result).toContain("export const aTodoWithoutNestedSelection");
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
