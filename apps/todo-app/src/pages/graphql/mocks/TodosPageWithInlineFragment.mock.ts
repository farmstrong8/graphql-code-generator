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

type AuthorFragment = {
    __typename: "Author";
    id: string;
    name: string;
};

export const aAuthorFragment = createBuilder<AuthorFragment>({
    __typename: "Author",
    id: "0bcb061b-4b10-4ca8-8b6e-cca8ae349ecd",
    name: "Eum deserunt et id.",
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
            id: "a9c8cc01-1a3b-4bc2-ac8f-d9af713d69e4",
            title: "Ullam ut cumque doloremque cupiditate est et vel aperiam.",
            completed: false,
            dueAt: "1974-12-31",
            author: {
                __typename: "Author",
                id: "50fabdae-7b45-4f8f-9344-bfff9287da11",
                name: "Omnis et autem sunt occaecati est vel.",
            },
        },
    });
