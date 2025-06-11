import * as Types from "../../../types.generated";

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

type AuthorInlineFragmentFragment = {
    __typename: "Author";
    id: string;
    name: string;
};

export const aAuthorInlineFragmentFragment =
    createBuilder<AuthorInlineFragmentFragment>({
        __typename: "Author",
        id: "36f666f4-37ce-4181-9fe2-7f83990cc884",
        name: "Molestias similique reiciendis quidem beatae impedit consequuntur.",
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
        id: "2781205d-0890-4520-b683-84f6940f80fc",
        title: "Quas enim ipsam labore hic.",
        completed: true,
        dueAt: "2010-07-07",
        author: {
            __typename: "Author",
            id: "2f18e499-5790-4108-806a-e8f57aa6fde8",
            name: "Laboriosam sint sit dolorem incidunt perferendis qui.",
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
