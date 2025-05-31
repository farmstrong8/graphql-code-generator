import { describe, it, expect } from "vitest";
import { buildSchema, parse } from "graphql";
import { plugin } from "../plugin";

const schema = buildSchema(`
  type Query {
    todos: [Todo!]!
    todo(id: ID!): TodoResult
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

  type Error {
    message: String!
  }

  union TodoResult = Todo | Error

  input AddTodoInput {
    title: String!
    dueAt: Date
  }

  scalar Date
`);

describe("Plugin Integration", () => {
    it("should generate complete mock file with all features", async () => {
        const documents = [
            {
                document: parse(`
          fragment AuthorFields on Author {
            id
            name
            email
          }

          query GetTodos {
            todos {
              id
              title
              completed
              author {
                ...AuthorFields
              }
            }
          }

          query GetTodoById($id: ID!) {
            todo(id: $id) {
              ... on Todo {
                id
                title
                completed
                dueAt
              }
              ... on Error {
                message
              }
            }
          }

          mutation AddTodo($input: AddTodoInput!) {
            addTodo(input: $input) {
              id
              title
              completed
              dueAt
            }
          }
        `),
            },
        ];

        const config = {
            scalars: {
                Date: {
                    generator: "date",
                    arguments: "YYYY-MM-DD",
                },
            },
        };

        const result = await plugin(schema, documents, config);

        // Should include boilerplate
        expect(result).toContain("function createBuilder<T extends object>");
        expect(result).toContain("type DeepPartial<T>");

        // Should generate fragment mock
        expect(result).toContain("export const aAuthorFields");
        expect(result).toContain("createBuilder<AuthorFieldsFragment>");

        // Should generate query mocks
        expect(result).toContain("export const aGetTodos");
        expect(result).toContain("createBuilder<GetTodos>");

        // Should generate inline fragment variants
        expect(result).toContain("export const aGetTodoByIdAsTodo");
        expect(result).toContain("export const aGetTodoByIdAsError");

        // Should generate mutation mock
        expect(result).toContain("export const aAddTodo");
        expect(result).toContain("createBuilder<AddTodo>");

        // Should handle custom scalars
        expect(result).toContain("dueAt:");
        // Plugin generates actual values, not code strings

        // Should include proper types
        expect(result).toContain('"__typename": "Todo"');
        expect(result).toContain('"__typename": "Author"');
        expect(result).toContain('"__typename": "Error"');
        expect(result).toContain('"__typename": "Mutation"');
        expect(result).toContain('"__typename": "Query"');

        // Should handle nested objects
        expect(result).toContain("todos: {"); // Single object, not array
        expect(result).toContain("author: {");
    });

    it("should handle empty documents gracefully", async () => {
        const result = await plugin(schema, [], {});

        expect(result).toBe("");
    });

    it("should handle documents without operations", async () => {
        const documents = [
            {
                document: parse(`
          # Just a comment
          type SomeType {
            field: String
          }
        `),
            },
        ];

        const result = await plugin(schema, documents, {});

        expect(result).toBe("");
    });

    it("should validate missing scalar configurations", async () => {
        const documents = [
            {
                document: parse(`
          query GetTodo {
            todo(id: "1") {
              ... on Todo {
                dueAt
              }
            }
          }
        `),
            },
        ];

        // Should not throw but might log warning (depends on implementation)
        const result = await plugin(schema, documents, {});

        expect(result).toContain("export const aGetTodo");
        // Should generate actual values, not casual code strings
        expect(result).toContain("dueAt:");
    });

    it("should handle complex nested structures", async () => {
        const complexSchema = buildSchema(`
      type Query {
        user: User
      }

      type User {
        id: ID!
        profile: Profile
        posts: [Post!]!
        friends: [User!]!
      }

      type Profile {
        bio: String
        avatar: String
        settings: Settings
      }

      type Settings {
        theme: String
        notifications: Boolean
      }

      type Post {
        id: ID!
        title: String!
        content: String!
        author: User!
      }
    `);

        const documents = [
            {
                document: parse(`
          query GetUser {
            user {
              id
              profile {
                bio
                avatar
                settings {
                  theme
                  notifications
                }
              }
              posts {
                id
                title
                content
                author {
                  id
                }
              }
              friends {
                id
                profile {
                  bio
                }
              }
            }
          }
        `),
            },
        ];

        const result = await plugin(complexSchema, documents, {});

        expect(result).toContain("export const aGetUser");
        expect(result).toContain("profile: {");
        expect(result).toContain("settings: {");
        expect(result).toContain("posts: {"); // Single object, not array
        expect(result).toContain("friends: {"); // Single object, not array
        expect(result).toContain("author: {");

        // Should handle proper nesting and array structures
        expect(result).toContain('"__typename": "User"');
        expect(result).toContain('"__typename": "Profile"');
        expect(result).toContain('"__typename": "Settings"');
        expect(result).toContain('"__typename": "Post"');
    });
});
