import { merge } from "lodash";

type DeepPartial<T> = T extends (...args: unknown[]) => unknown
    ? T
    : T extends Array<infer U>
      ? Array<DeepPartial<U>>
      : T extends object
        ? { [K in keyof T]?: DeepPartial<T[K]> }
        : T;

function createBuilder<T extends object>(base: T) {
    return (overrides?: DeepPartial<T>): T => merge({}, base, overrides);
}

type AddTodoMutation = {
    __typename: "Mutation";
    addTodo: {
        __typename: "Todo";
        id: string;
        title: string;
        completed: boolean;
    };
};

export const aAddTodoMutation = createBuilder<AddTodoMutation>({
    __typename: "Mutation",
    addTodo: {
        __typename: "Todo",
        id: "047bde61-cda2-449f-a4f2-1a66d426e3a3",
        title: "Vitae voluptatem quam omnis eaque.",
        completed: true,
    },
});

type AuthorFragment = {
    __typename: "Author";
    id: string;
    name: string;
};

export const aAuthorFragment = createBuilder<AuthorFragment>({
    __typename: "Author",
    id: "881340fe-1e62-4df6-8fb6-5d7cac0ac7a2",
    name: "At non enim impedit ut reiciendis neque ut illum.",
});

type DeleteTodoMutation = {
    __typename: "Mutation";
    deleteTodo: boolean;
};

export const aDeleteTodoMutation = createBuilder<DeleteTodoMutation>({
    __typename: "Mutation",
    deleteTodo: true,
});

type TodoDetailsPageQueryAsTodo = {
    __typename: "Query";
    todo: {
        id: string;
        title: string;
        completed: boolean;
        message: string;
        __typename: "Todo" | "Error";
    };
};

export const aTodoDetailsPageQueryAsTodo =
    createBuilder<TodoDetailsPageQueryAsTodo>({
        __typename: "Query",
        todo: {
            __typename: "Todo",
            id: "36c8445c-1985-4a17-8867-6bf213f5af42",
            title: "Nobis odit non maxime reprehenderit eaque odit sequi.",
            completed: true,
        },
    });

type TodoDetailsPageQueryAsError = {
    __typename: "Query";
    todo: {
        id: string;
        title: string;
        completed: boolean;
        message: string;
        __typename: "Todo" | "Error";
    };
};

export const aTodoDetailsPageQueryAsError =
    createBuilder<TodoDetailsPageQueryAsError>({
        __typename: "Query",
        todo: {
            __typename: "Error",
            message: "At enim ipsam et fuga minima.",
        },
    });

type TodosPageQuery = {
    __typename: "Query";
    todos: Array<{
        __typename: "Todo";
        id: string;
        title: string;
        completed: boolean;
        dueAt: string;
        author: {
            __typename: "Author";
        };
    }>;
};

export const aTodosPageQuery = createBuilder<TodosPageQuery>({
    __typename: "Query",
    todos: {
        __typename: "Todo",
        id: "f859cb36-ed99-4f64-9be9-7c5b42759bfb",
        title: "Magni rem quaerat nam maiores.",
        completed: true,
        dueAt: "2009-10-07",
        author: {
            __typename: "Author",
        },
    },
});

type TodosPageWithInlineFragmentQuery = {
    __typename: "Query";
    todos: Array<{
        __typename: "Todo";
        id: string;
        title: string;
        completed: boolean;
        dueAt: string;
        author: {
            __typename: "Author";
        };
    }>;
};

export const aTodosPageWithInlineFragmentQuery =
    createBuilder<TodosPageWithInlineFragmentQuery>({
        __typename: "Query",
        todos: {
            __typename: "Todo",
            id: "7d34d23d-2539-4879-8dab-740a1cc376e5",
            title: "Earum voluptate impedit similique commodi.",
            completed: false,
            dueAt: "1996-04-08",
            author: {
                __typename: "Author",
            },
        },
    });

type ToggleTodoMutation = {
    __typename: "Mutation";
    toggleTodo: {
        __typename: "Todo";
        id: string;
        title: string;
        completed: boolean;
    };
};

export const aToggleTodoMutation = createBuilder<ToggleTodoMutation>({
    __typename: "Mutation",
    toggleTodo: {
        __typename: "Todo",
        id: "d36503b9-0798-4bcd-b50e-cc2f658b4429",
        title: "Optio commodi sunt impedit aut doloremque ut architecto aut natus.",
        completed: true,
    },
});
