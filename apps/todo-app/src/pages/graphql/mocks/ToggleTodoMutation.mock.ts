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
    id: "c202b733-ce9b-4b2b-b5bf-ca57cc739183",
    title: "Esse accusantium aliquam tempora quos dolor nisi ut quia officia.",
    completed: false,
});

type ToggleTodoMutation = {
    __typename: "Mutation";
    toggleTodo: ToggleTodoTodo;
};

export const aToggleTodoMutation = createBuilder<ToggleTodoMutation>({
    __typename: "Mutation",
    toggleTodo: aToggleTodoTodo(),
});
