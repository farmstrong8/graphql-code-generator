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

type ToggleTodoTodo = {
    __typename: "Todo";
    id: string;
    title: string;
    completed: boolean;
};

export const aToggleTodoTodo = createBuilder<ToggleTodoTodo>({
    __typename: "Todo",
    id: "1f3c027c-181c-412d-9dd9-3f1222eeb4d6",
    title: "Nulla eum aut ab quia.",
    completed: true,
});

type ToggleTodoMutation = {
    __typename: "Mutation";
    toggleTodo: ToggleTodoTodo;
};

export const aToggleTodoMutation = createBuilder<ToggleTodoMutation>({
    __typename: "Mutation",
    toggleTodo: aToggleTodoTodo(),
});
