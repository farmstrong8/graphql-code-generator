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

type AuthorInlineFragment = {
    __typename: "Author";
    id: string;
    name: string;
};

export const aAuthorInlineFragment = createBuilder<AuthorInlineFragment>({
    __typename: "Author",
    id: "b4697feb-ddce-4e47-82cd-b77b7787b3c1",
    name: "Omnis facere voluptatibus id.",
});

type TodosPageWithInlineFragmentTodosAuthor = {
    __typename: "Author";
    id: string;
    name: string;
};

export const aTodosPageWithInlineFragmentTodosAuthor =
    createBuilder<TodosPageWithInlineFragmentTodosAuthor>({
        __typename: "Author",
        id: "215e30d1-e0d3-455a-bdf8-3c39a08e89a7",
        name: "Optio cumque dolores laborum porro ab id deleniti quis quia.",
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
        id: "c0d1db04-98d7-4288-a8c0-e423e3a80fb6",
        title: "Iusto ad hic blanditiis ut.",
        completed: true,
        dueAt: "1975-01-26",
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
