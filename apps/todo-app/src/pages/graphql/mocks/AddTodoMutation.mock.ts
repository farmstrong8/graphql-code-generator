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

type AddTodo = {
    __typename: "Mutation";
    addTodo: {
        __typename: "Todo";
        id: "646024a5-dc30-41e5-84b2-f1365e4b889b";
        title: "In iure est.";
        completed: false;
    };
};

export const aAddTodo = createBuilder<AddTodo>({
    __typename: "Mutation",
    addTodo: {
        __typename: "Todo",
        id: "646024a5-dc30-41e5-84b2-f1365e4b889b",
        title: "In iure est.",
        completed: false,
    },
});
