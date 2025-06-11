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
        id: "1a434995-c1d2-44dc-9483-2b86dca6a694",
        name: "Provident dolor id.",
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
        id: "c508458f-c222-4fbe-a541-2df3d8bd4c69",
        title: "Consectetur blanditiis et perspiciatis voluptatem at et est.",
        completed: true,
        dueAt: "1984-04-26",
        author: {
            __typename: "Author",
            id: "763bea4a-1d43-46ce-9daa-10c6be091443",
            name: "Natus dicta sapiente eaque.",
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
