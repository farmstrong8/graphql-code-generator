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
    email: "Debitis unde ex dolores dolorem alias aut.",
    id: "170db195-e06a-40c2-b96b-6346b330d2d4",
    name: "Deleniti omnis voluptas doloribus natus non sapiente.",
});

type TodosPageTodos = {
    __typename: "Todo";
    id: string;
    title: string;
    completed: boolean;
    dueAt?: string;
    status: "CANCELLED" | "COMPLETED" | "DRAFT" | "IN_PROGRESS";
    author: { __typename: "Author"; email: string; id: string; name: string };
};

export const aTodosPageTodos = createBuilder<TodosPageTodos>({
    __typename: "Todo",
    id: "8d924ea9-f541-46bb-916b-3e5f927e6056",
    title: "Veritatis ducimus maxime eum quia voluptatem perferendis aliquam.",
    completed: true,
    dueAt: "1972-09-18",
    status: "CANCELLED",
    author: aTodosPageTodosAuthor(),
});

type TodosPageQuery = {
    __typename: "Query";
    todos: Array<{
        __typename: "Todo";
        id: string;
        title: string;
        completed: boolean;
        dueAt?: string;
        status: "CANCELLED" | "COMPLETED" | "DRAFT" | "IN_PROGRESS";
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
