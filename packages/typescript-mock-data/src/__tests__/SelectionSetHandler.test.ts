import { describe, it, expect } from "vitest";
import { buildSchema, parse } from "graphql";
import { SelectionSetHandler } from "../handlers/SelectionSetHandler";

const schema = buildSchema(`
  type Query {
    hello: String
  }

  type Todo {
    id: ID!
    title: String!
    completed: Boolean!
    author: Author
  }

  type Author {
    id: ID!
    name: String!
    email: String
  }
`);

describe("SelectionSetHandler", () => {
    const handler = new SelectionSetHandler(schema);

    it("should build fragment registry from fragment definitions", () => {
        const document = parse(`
      fragment AuthorFields on Author {
        id
        name
        email
      }

      fragment TodoFields on Todo {
        id
        title
        completed
      }
    `);

        const fragments = document.definitions.filter(
            (def) => def.kind === "FragmentDefinition",
        );
        const registry = handler.buildFragmentRegistry(fragments as any);

        expect(registry.size).toBe(2);
        expect(registry.has("AuthorFields")).toBe(true);
        expect(registry.has("TodoFields")).toBe(true);
    });

    it("should resolve selection set with fragment spreads", () => {
        const document = parse(`
      fragment AuthorFields on Author {
        id
        name
        email
      }

      query GetTodos {
        todos {
          id
          title
          author {
            ...AuthorFields
          }
        }
      }
    `);

        const fragments = document.definitions.filter(
            (def) => def.kind === "FragmentDefinition",
        );
        const query = document.definitions.find(
            (def) => def.kind === "OperationDefinition",
        );
        const registry = handler.buildFragmentRegistry(fragments as any);

        const resolvedSelectionSet = handler.resolveSelectionSet(
            (query as any).selectionSet,
            registry,
        );

        expect(resolvedSelectionSet.selections).toBeDefined();
        // Fragment should be expanded in place
        const todosField = resolvedSelectionSet.selections.find(
            (sel: any) => sel.kind === "Field" && sel.name.value === "todos",
        );
        expect(todosField).toBeDefined();
    });

    it("should handle inline fragments", () => {
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

        const query = document.definitions.find(
            (def) => def.kind === "OperationDefinition",
        );
        const registry = new Map();

        const resolvedSelectionSet = handler.resolveSelectionSet(
            (query as any).selectionSet,
            registry,
        );

        expect(resolvedSelectionSet.selections).toBeDefined();
        const searchField = resolvedSelectionSet.selections.find(
            (sel: any) => sel.kind === "Field" && sel.name.value === "search",
        );
        expect(searchField).toBeDefined();

        // Should preserve inline fragments
        const inlineFragments = (
            searchField as any
        ).selectionSet.selections.filter(
            (sel: any) => sel.kind === "InlineFragment",
        );
        expect(inlineFragments).toHaveLength(2);
    });

    it("should detect inline fragments", () => {
        const document = parse(`
      query SearchQuery {
        search {
          ... on Todo {
            id
            title
          }
        }
      }
    `);

        const query = document.definitions.find(
            (def) => def.kind === "OperationDefinition",
        );
        const searchField = (query as any).selectionSet.selections.find(
            (sel: any) => sel.name.value === "search",
        );

        const hasInlineFragments = handler.hasInlineFragments(
            searchField.selectionSet,
        );
        expect(hasInlineFragments).toBe(true);
    });

    it("should detect fragment spreads", () => {
        const document = parse(`
      query GetTodos {
        todos {
          ...TodoFields
        }
      }
    `);

        const query = document.definitions.find(
            (def) => def.kind === "OperationDefinition",
        );
        const todosField = (query as any).selectionSet.selections.find(
            (sel: any) => sel.name.value === "todos",
        );

        const hasFragmentSpreads = handler.hasFragmentSpreads(
            todosField.selectionSet,
        );
        expect(hasFragmentSpreads).toBe(true);
    });

    it("should handle missing fragments gracefully", () => {
        const document = parse(`
      query GetTodos {
        todos {
          ...MissingFragment
        }
      }
    `);

        const query = document.definitions.find(
            (def) => def.kind === "OperationDefinition",
        );
        const registry = new Map(); // Empty registry

        const resolvedSelectionSet = handler.resolveSelectionSet(
            (query as any).selectionSet,
            registry,
        );

        // Should not crash and should skip the missing fragment
        expect(resolvedSelectionSet.selections).toBeDefined();
        const todosField = resolvedSelectionSet.selections.find(
            (sel: any) => sel.kind === "Field" && sel.name.value === "todos",
        );
        expect(todosField).toBeDefined();
        // Fragment spread should be removed since it couldn't be resolved
        expect((todosField as any).selectionSet.selections).toHaveLength(0);
    });
});
