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

type AuthorFragmentFragment = {
    __typename: "Author";
    id: string;
    name: string;
};

export const aAuthorFragmentFragment = createBuilder<AuthorFragmentFragment>({
    __typename: "Author",
    id: "043495d0-2b97-4ef9-b126-acd54d73ae1e",
    name: "Quasi unde aut modi.",
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
        todos: [
            {
                __typename: "Todo",
                id: "86138ef5-bebf-43bf-adc5-9d03e9257c7a",
                title: "Quos dolorem ducimus ullam ut.",
                completed: false,
                dueAt: "1981-01-07",
                author: {
                    __typename: "Author",
                    id: "ccfb498c-2b6a-4738-beb7-0d52d5c46cd3",
                    name: "Rem sunt in quia.",
                },
            },
        ],
    });
