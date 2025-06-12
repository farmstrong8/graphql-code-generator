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

type AuthorInlineFragmentFragment = {
    __typename: "Author";
    id: string;
    name: string;
};

export const aAuthorInlineFragmentFragment =
    createBuilder<AuthorInlineFragmentFragment>({
        __typename: "Author",
        id: "091ea41c-48a4-4ccc-8698-c13ca9b7ed90",
        name: "Qui sit ex facere nulla.",
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
        id: "2c3a203e-3bd3-44dd-ae66-7c162de0cd63",
        title: "Quidem velit qui illo est optio omnis fugiat sapiente.",
        completed: true,
        dueAt: "1979-07-07",
        author: {
            __typename: "Author",
            id: "c3ed5e72-bc31-43b1-a000-b617f1dfb686",
            name: "Vero voluptatem quis.",
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
