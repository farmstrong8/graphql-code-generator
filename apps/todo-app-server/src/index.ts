import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { GraphQLScalarType, Kind } from "graphql";
import { randomUUID } from "crypto";

// Schema definition
const typeDefs = `#graphql
  scalar Date

  type Author {
    id: ID!
    name: String!
    email: String!
  }

  type Todo {
    id: ID!
    title: String!
    completed: Boolean!
    createdAt: Date!
    dueAt: Date
    author: Author!
    tags: [String!]!
  }

  type Error {
    message: String!
  }

  union TodoResult = Todo | Error

  type Query {
    todos: [Todo!]!
    todo(id: ID!): TodoResult
  }

  type Mutation {
    addTodo(title: String!): Todo!
    toggleTodo(id: ID!): Todo
    deleteTodo(id: ID!): Boolean!
  }
`;

// In-memory data store with full structure
let todos = [
    {
        id: "1",
        title: "Buy groceries",
        completed: false,
        createdAt: new Date("2024-05-01T10:00:00Z"),
        dueAt: new Date("2024-05-05T10:00:00Z"),
        author: {
            id: randomUUID(),
            name: "Jane Doe",
            email: "jane@example.com",
        },
        tags: ["shopping", "urgent"],
    },
    {
        id: "2",
        title: "Walk the dog",
        completed: true,
        createdAt: new Date("2024-05-02T08:30:00Z"),
        dueAt: new Date("2024-05-04T08:30:00Z"),
        author: {
            id: randomUUID(),
            name: "John Smith",
            email: "john@example.com",
        },
        tags: ["pets", "morning"],
    },
];

// Resolvers
const resolvers = {
    Date: new GraphQLScalarType({
        name: "Date",
        description: "Custom scalar for ISO Date strings",
        serialize(value: string) {
            return new Date(value).toISOString();
        },
        parseValue(value: string) {
            return new Date(value);
        },
        parseLiteral(ast) {
            if (ast.kind === Kind.STRING) {
                return new Date(ast.value);
            }
            return null;
        },
    }),

    TodoResult: {
        __resolveType(obj: any) {
            if (obj.message) return "Error";
            return "Todo";
        },
    },

    Query: {
        todos: () => todos,
        todo: (_: any, { id }: { id: string }) =>
            todos.find((todo) => todo.id === id) || {
                message: "Todo not found",
            },
    },

    Mutation: {
        addTodo: (_: any, { title }: { title: string }) => {
            const newTodo = {
                id: String(Date.now()),
                title,
                completed: false,
                createdAt: new Date(),
                dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days later
                author: {
                    id: randomUUID(),
                    name: "Alice Johnson",
                    email: "alice@example.com",
                },
                tags: ["new", "inbox"],
            };
            todos.push(newTodo);
            return newTodo;
        },

        toggleTodo: (_: any, { id }: { id: string }) => {
            const todo = todos.find((t) => t.id === id);
            if (!todo) return null;
            todo.completed = !todo.completed;
            return todo;
        },

        deleteTodo: (_: any, { id }: { id: string }) => {
            const index = todos.findIndex((t) => t.id === id);
            if (index === -1) return false;
            todos.splice(index, 1);
            return true;
        },
    },
};

// Start server
const server = new ApolloServer({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, {
    listen: { port: 4000, path: "graphql" },
});

console.log(`🚀 Todo server ready at: ${url}graphql`);
