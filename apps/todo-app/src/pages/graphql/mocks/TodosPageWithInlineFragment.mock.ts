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
    id: "97dbccba-69c1-407a-b780-f6f305fbf8a5";
    name: "Delectus et perferendis reprehenderit animi vel nulla.";
};

export const aAuthorFragmentFragment = createBuilder<AuthorFragmentFragment>({
    __typename: "Author",
    id: "97dbccba-69c1-407a-b780-f6f305fbf8a5",
    name: "Delectus et perferendis reprehenderit animi vel nulla.",
});

type TodosPageWithInlineFragment = {
    __typename: "Query";
    todos: {
        __typename: "Todo";
        id: "49b4a523-1b21-451c-96cb-7e87099337ee";
        title: "Est tempore quibusdam et.";
        completed: false;
        dueAt: "1974-12-24";
        author: {
            __typename: "Author";
            id: "8cc56e26-1cd7-45b0-b999-8b2a4d9f7cd6";
            name: "Labore culpa eius et.";
        };
    };
};

export const aTodosPageWithInlineFragment =
    createBuilder<TodosPageWithInlineFragment>({
        __typename: "Query",
        todos: {
            __typename: "Todo",
            id: "49b4a523-1b21-451c-96cb-7e87099337ee",
            title: "Est tempore quibusdam et.",
            completed: false,
            dueAt: "1974-12-24",
            author: {
                __typename: "Author",
                id: "8cc56e26-1cd7-45b0-b999-8b2a4d9f7cd6",
                name: "Labore culpa eius et.",
            },
        },
    });
