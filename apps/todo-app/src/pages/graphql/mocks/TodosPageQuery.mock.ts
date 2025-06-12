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

type TodosPageTodo = {
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

export const aTodosPageTodo = createBuilder<TodosPageTodo>({
    __typename: "Todo",
    id: "216d71ab-6f60-4a81-b4f7-133253b729c3",
    title: "Rerum ex sunt necessitatibus enim fuga repellendus.",
    completed: false,
    dueAt: "2008-10-15",
    author: {
        __typename: "Author",
        email: "Ut ipsum dolores odio cupiditate aliquam.",
        id: "7c0e30ae-238d-4a65-8208-10ab5e2a2c92",
        name: "Porro autem provident.",
    },
});

type TodosPageQuery = {
    __typename: "Query";
    todos: Array<TodosPageTodo>;
};

export const aTodosPageQuery = createBuilder<TodosPageQuery>({
    __typename: "Query",
    todos: [aTodosPageTodo()],
});
