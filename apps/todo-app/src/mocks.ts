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

type AddTodoAddTodo = {
    __typename: "Todo";
    id: string;
    title: string;
    completed: boolean;
};

export const aAddTodoAddTodo = createBuilder<AddTodoAddTodo>({
    __typename: "Todo",
    id: "ae6db12b-7d07-4d85-ae2f-697dbe0ca95a",
    title: "Ipsam saepe ut pariatur officiis.",
    completed: true,
});

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
    addTodo: aAddTodoAddTodo(),
});

type AuthorFragment = {
    __typename: "Author";
    id: string;
    name: string;
};

export const aAuthorFragment = createBuilder<AuthorFragment>({
    __typename: "Author",
    id: "b206da8e-8d0a-4f64-9d64-b1d5ec3d48ef",
    name: "Voluptas fugiat et quam cumque id iure.",
});

type DeleteTodoMutation = {
    __typename: "Mutation";
    deleteTodo: boolean;
};

export const aDeleteTodoMutation = createBuilder<DeleteTodoMutation>({
    __typename: "Mutation",
    deleteTodo: false,
});

type TodoDetailsPageQueryAsTodoTodo = {
    __typename: "Todo";
    id: string;
    title: string;
    completed: boolean;
};

export const aTodoDetailsPageQueryAsTodoTodo =
    createBuilder<TodoDetailsPageQueryAsTodoTodo>({
        __typename: "Todo",
        id: "f72eaaca-6642-488d-872c-d84f2edd39d5",
        title: "Voluptas aliquam rerum nobis facilis et et consectetur.",
        completed: true,
    });

type TodoDetailsPageQueryAsTodo = {
    __typename: "Query";
    todo: TodoDetailsPageQueryAsTodoTodo;
};

export const aTodoDetailsPageQueryAsTodo =
    createBuilder<TodoDetailsPageQueryAsTodo>({
        __typename: "Query",
        todo: aTodoDetailsPageQueryAsTodoTodo(),
    });

type TodoDetailsPageQueryAsErrorError = {
    __typename: "Error";
    message: string;
};

export const aTodoDetailsPageQueryAsErrorError =
    createBuilder<TodoDetailsPageQueryAsErrorError>({
        __typename: "Error",
        message: "Ducimus quia officiis quo distinctio consequatur.",
    });

type TodoDetailsPageQueryAsError = {
    __typename: "Query";
    todo: TodoDetailsPageQueryAsErrorError;
};

export const aTodoDetailsPageQueryAsError =
    createBuilder<TodoDetailsPageQueryAsError>({
        __typename: "Query",
        todo: aTodoDetailsPageQueryAsErrorError(),
    });

type TodosPageTodosAuthor = {
    __typename: "Author";
    id: string;
    name: string;
};

export const aTodosPageTodosAuthor = createBuilder<TodosPageTodosAuthor>({
    __typename: "Author",
    id: "ae313fd9-b188-41aa-b7d3-977cc367fa5e",
    name: "Quia et et ea recusandae consequatur et rerum dicta ab.",
});

type TodosPageTodos = {
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

export const aTodosPageTodos = createBuilder<TodosPageTodos>({
    __typename: "Todo",
    id: "7cf596c6-ddbe-4c2d-9b7e-b70668ab7bbf",
    title: "Nemo consequatur quidem consequatur voluptatem sed eius.",
    completed: true,
    dueAt: "1999-01-23",
    author: aTodosPageTodosAuthor(),
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
            id: string;
            name: string;
        };
    }>;
};

export const aTodosPageQuery = createBuilder<TodosPageQuery>({
    __typename: "Query",
    todos: [aTodosPageTodos()],
});

type AuthorInlineFragment = {
    __typename: "Author";
    id: string;
    name: string;
};

export const aAuthorInlineFragment = createBuilder<AuthorInlineFragment>({
    __typename: "Author",
    id: "59f08ae1-4974-4c39-9086-819052d666e8",
    name: "Exercitationem nesciunt voluptas optio.",
});

type TodosPageWithInlineFragmentTodosAuthor = {
    __typename: "Author";
    id: string;
    name: string;
};

export const aTodosPageWithInlineFragmentTodosAuthor =
    createBuilder<TodosPageWithInlineFragmentTodosAuthor>({
        __typename: "Author",
        id: "7bdb1335-369d-400a-aed8-e9dab58fa1e8",
        name: "Ea et qui necessitatibus voluptas qui.",
    });

type TodosPageWithInlineFragmentTodos = {
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

export const aTodosPageWithInlineFragmentTodos =
    createBuilder<TodosPageWithInlineFragmentTodos>({
        __typename: "Todo",
        id: "733ef63f-9c71-49c8-bf5d-9ea02f0f65f8",
        title: "Aut debitis reiciendis.",
        completed: false,
        dueAt: "1981-09-19",
        author: aTodosPageWithInlineFragmentTodosAuthor(),
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
            id: string;
            name: string;
        };
    }>;
};

export const aTodosPageWithInlineFragmentQuery =
    createBuilder<TodosPageWithInlineFragmentQuery>({
        __typename: "Query",
        todos: [aTodosPageWithInlineFragmentTodos()],
    });

type ToggleTodoToggleTodo = {
    __typename: "Todo";
    id: string;
    title: string;
    completed: boolean;
};

export const aToggleTodoToggleTodo = createBuilder<ToggleTodoToggleTodo>({
    __typename: "Todo",
    id: "be32f8de-772f-46fe-a6b9-830103ea34fa",
    title: "Sit voluptas quis animi sit perspiciatis ipsum voluptatibus.",
    completed: true,
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
    toggleTodo: aToggleTodoToggleTodo(),
});
