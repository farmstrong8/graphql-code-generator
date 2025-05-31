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

type AddTodoTodo = {
    __typename: "Todo";
    id: string;
    title: string;
    completed: boolean;
};

export const aAddTodoTodo = createBuilder<AddTodoTodo>({
    __typename: "Todo",
    id: "72bcca33-237c-473c-9e64-4ee5ccb7746c",
    title: "Iusto fuga sapiente cupiditate.",
    completed: true,
});

type AddTodoMutation = {
    __typename: "Mutation";
    addTodo: AddTodoTodo;
};

export const aAddTodoMutation = createBuilder<AddTodoMutation>({
    __typename: "Mutation",
    addTodo: aAddTodoTodo(),
});
