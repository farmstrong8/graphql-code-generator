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
    id: "0b57bf32-48e4-4fdc-8088-6c852c0e0235",
    name: "Occaecati et quia architecto in cum velit enim perspiciatis.",
});

type TodosPageWithInlineFragmentTodosAuthor = {
    __typename: "Author";
    id: string;
    name: string;
};

export const aTodosPageWithInlineFragmentTodosAuthor =
    createBuilder<TodosPageWithInlineFragmentTodosAuthor>({
        __typename: "Author",
        id: "5ba7ad03-8ac8-45e2-a349-0b70425c94ff",
        name: "Delectus et quod velit aliquam quae.",
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
        id: "44bf9bbd-561f-47d8-b9c4-f2b43c2f753c",
        title: "Deleniti doloribus numquam quos ratione.",
        completed: true,
        dueAt: "2003-03-19",
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
