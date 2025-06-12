import { mergeWith } from "lodash";

type DeepPartial<T> = T extends (...args: unknown[]) => unknown
    ? T
    : T extends Array<infer U>
      ? Array<DeepPartial<U>>
      : T extends object
        ? { [K in keyof T]?: DeepPartial<T[K]> }
        : T;

function createBuilder<T extends object>(baseObject: T) {
    return (overrides?: DeepPartial<T>): T =>
        mergeWith({}, baseObject, overrides, (objValue, srcValue) => {
            if (Array.isArray(objValue) && Array.isArray(srcValue)) {
                return srcValue;
            }
        });
}

type AddTodoTodo = {
    __typename: "Todo";
    id: string;
    title: string;
    completed: boolean;
};

export const aAddTodoTodo = createBuilder<AddTodoTodo>({
    __typename: "Todo",
    id: "144adc12-76db-4f58-80d1-724977be398b",
    title: "Et dolor eos asperiores odio dolore.",
    completed: true,
});

type AddTodoMutation = {
    __typename: "Mutation";
    addTodo: AddTodoTodo;
};

export const aAddTodoMutation = createBuilder<AddTodoMutation>({
    __typename: "Mutation",
    addTodo: aAddTodoTodo(),
});

type AuthorFragmentFragment = {
    __typename: "Author";
    id: string;
    name: string;
};

export const aAuthorFragmentFragment = createBuilder<AuthorFragmentFragment>({
    __typename: "Author",
    id: "536df7c9-d96b-42f1-8c78-66f4eddc5cf1",
    name: "Quis non nesciunt quis et aut aliquid et rerum.",
});

type DeleteTodoMutation = {
    __typename: "Mutation";
    deleteTodo: boolean;
};

export const aDeleteTodoMutation = createBuilder<DeleteTodoMutation>({
    __typename: "Mutation",
    deleteTodo: false,
});

type TodoDetailsPageQueryAsTodo = {
    __typename: "Query";
    todo: {
        id: string;
        title: string;
        completed: boolean;
        __typename: "Todo";
    };
};

export const aTodoDetailsPageQueryAsTodo =
    createBuilder<TodoDetailsPageQueryAsTodo>({
        __typename: "Query",
        todo: {
            __typename: "Todo",
            id: "d76a5eb7-4d97-4d30-8e9d-7422f7e4eebf",
            title: "Et nesciunt aut ex optio consequatur est non.",
            completed: true,
        },
    });

type TodoDetailsPageQueryAsError = {
    __typename: "Query";
    todo: {
        message: string;
        __typename: "Error";
    };
};

export const aTodoDetailsPageQueryAsError =
    createBuilder<TodoDetailsPageQueryAsError>({
        __typename: "Query",
        todo: {
            __typename: "Error",
            message: "Minima magni vitae dolorem nam non.",
        },
    });

type TodosPageTodo = {
    __typename: "Todo";
    id: string;
    title: string;
    completed: boolean;
    dueAt: string;
    author: {
        __typename: "Author";
        id: string;
        name: string;
    };
};

export const aTodosPageTodo = createBuilder<TodosPageTodo>({
    __typename: "Todo",
    id: "c938d10a-5d85-4871-afba-d299106c9c7d",
    title: "Autem blanditiis ea consequatur ratione.",
    completed: false,
    dueAt: "1983-03-18",
    author: {
        __typename: "Author",
        id: "372ffe03-29d2-47c4-92f2-60970422b9c1",
        name: "Vero quis sit autem sunt at quas et.",
    },
});

type TodosPageQuery = {
    __typename: "Query";
    todos: Array<TodosPageTodo>;
};

export const aTodosPageQuery = createBuilder<TodosPageQuery>({
    __typename: "Query",
    todos: [aTodosPageTodo()],
});

type AuthorInlineFragmentFragment = {
    __typename: "Author";
    id: string;
    name: string;
};

export const aAuthorInlineFragmentFragment =
    createBuilder<AuthorInlineFragmentFragment>({
        __typename: "Author",
        id: "8e844ffc-1244-45a2-9680-df8bc925a802",
        name: "Et blanditiis totam alias et non pariatur et.",
    });

type TodosPageWithInlineFragmentTodo = {
    __typename: "Todo";
    id: string;
    title: string;
    completed: boolean;
    dueAt: string;
    author: {
        __typename: "Author";
        id: string;
        name: string;
    };
};

export const aTodosPageWithInlineFragmentTodo =
    createBuilder<TodosPageWithInlineFragmentTodo>({
        __typename: "Todo",
        id: "9d5d2d6c-b33e-4c28-b663-324ac815d6ed",
        title: "Eos ducimus non et.",
        completed: true,
        dueAt: "1997-09-15",
        author: {
            __typename: "Author",
            id: "9ca216b7-57db-4183-8d05-84d4e5424d8e",
            name: "Cum omnis provident aut amet a modi sed dolorum.",
        },
    });

type TodosPageWithInlineFragmentQuery = {
    __typename: "Query";
    todos: Array<TodosPageWithInlineFragmentTodo>;
};

export const aTodosPageWithInlineFragmentQuery =
    createBuilder<TodosPageWithInlineFragmentQuery>({
        __typename: "Query",
        todos: [aTodosPageWithInlineFragmentTodo()],
    });

type ToggleTodoTodo = {
    __typename: "Todo";
    id: string;
    title: string;
    completed: boolean;
};

export const aToggleTodoTodo = createBuilder<ToggleTodoTodo>({
    __typename: "Todo",
    id: "f40a4bc0-7322-48db-a31e-778c04879b98",
    title: "Quo optio aperiam saepe.",
    completed: false,
});

type ToggleTodoMutation = {
    __typename: "Mutation";
    toggleTodo: ToggleTodoTodo;
};

export const aToggleTodoMutation = createBuilder<ToggleTodoMutation>({
    __typename: "Mutation",
    toggleTodo: aToggleTodoTodo(),
});
