import * as Types from "../../../types.generated";

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

type TodosPageTodosAuthor = {
    __typename: "Author";
    email: string;
    id: string;
    name: string;
};

export const aTodosPageTodosAuthor = createBuilder<TodosPageTodosAuthor>({
    __typename: "Author",
    email: "Quos similique minima tempore.",
    id: "bb64f4f9-c30f-444e-82f7-8eea57adbed8",
    name: "Non ad deserunt aut culpa consequatur et natus.",
});

type TodosPageTodos = {
    __typename: "Todo";
    id: string;
    title: string;
    completed: boolean;
    dueAt: string;
    author: {
        __typename: "Author";
        email: string;
        id: string;
        name: string;
    };
};

export const aTodosPageTodos = createBuilder<TodosPageTodos>({
    __typename: "Todo",
    id: "06535a33-9cd4-45f2-bac3-bdf791150f48",
    title: "Et aliquam voluptatem labore et doloremque placeat ratione voluptatibus occaecati.",
    completed: false,
    dueAt: "1988-03-17",
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
            email: string;
            id: string;
            name: string;
        };
    }>;
};

export const aTodosPageQuery = createBuilder<TodosPageQuery>({
    __typename: "Query",
    todos: [aTodosPageTodos()],
});
