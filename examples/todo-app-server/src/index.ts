import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

// GraphQL schema definition
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

    type Query {
        todos: [Todo!]!
        todo(id: ID!): Todo
    }

    type Mutation {
        addTodo(title: String!): Todo!
        toggleTodo(id: ID!): Todo
        deleteTodo(id: ID!): Boolean!
    }
`;

// In-memory data store
let todos = [
    { id: "1", title: "Buy groceries", completed: false },
    { id: "2", title: "Walk the dog", completed: true },
];

// Resolver functions
const resolvers = {
    Query: {
        todos: () => todos,
        todo: (_: any, { id }: { id: string }) =>
            todos.find((todo) => todo.id === id),
    },
    Mutation: {
        addTodo: (_: any, { title }: { title: string }) => {
            const newTodo = { id: String(Date.now()), title, completed: false };
            todos.push(newTodo);
            return newTodo;
        },
        toggleTodo: (_: any, { id }: { id: string }) => {
            const todo = todos.find((t) => t.id === id);
            if (todo) todo.completed = !todo.completed;
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
