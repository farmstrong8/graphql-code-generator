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
    id: "21390e1f-b443-4584-b51a-382f199e19c6",
    title: "Velit consequuntur repellat.",
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
    id: "3a7a72be-366e-44b2-bb6d-682ab27522ee",
    name: "Earum sed autem aut nam qui sed cumque.",
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
        id: "2a6e9ea2-34d3-4022-b2ed-f0a16da4bc60",
        title: "Dolores quasi et vel nihil quo.",
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
        message: "Quia temporibus aut et a quia aperiam aliquam.",
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
    id: "876ba734-83db-4631-9730-678086da0b57",
    name: "Expedita ipsam nihil voluptate.",
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
    id: "a8536566-0501-46ed-8d0f-a8bd0b813c90",
    title: "Earum ad inventore nobis illum enim non laboriosam voluptatibus error.",
    completed: true,
    dueAt: "1973-11-23",
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
    id: "97c09988-6965-4e36-a673-f22b32501ea6",
    name: "Et numquam sit sint sed.",
});

type TodosPageWithInlineFragmentTodosAuthor = {
    __typename: "Author";
    id: string;
    name: string;
};

export const aTodosPageWithInlineFragmentTodosAuthor =
    createBuilder<TodosPageWithInlineFragmentTodosAuthor>({
        __typename: "Author",
        id: "bf334fa6-f62c-41f5-92b6-ab350773a86e",
        name: "Culpa delectus inventore sit qui.",
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
        id: "30286b93-54d0-4375-b434-0e9c0ce95837",
        title: "Dolore earum dolorum quod.",
        completed: false,
        dueAt: "1978-12-31",
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
    id: "5b6c741e-fef7-468b-b5c3-7cc905b977a5",
    title: "Animi fugit sit laboriosam.",
    completed: false,
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
