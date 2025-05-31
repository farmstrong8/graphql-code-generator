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
        id: "2fe46c5c-e3ce-4ab9-b56f-6e1f7330deb1";
        title: "Commodi officia voluptatum illo molestias voluptatum provident rem.";
        completed: false;
    };
};

export const aAddTodo = createBuilder<AddTodo>({
    __typename: "Mutation",
    addTodo: {
        __typename: "Todo",
        id: "2fe46c5c-e3ce-4ab9-b56f-6e1f7330deb1",
        title: "Commodi officia voluptatum illo molestias voluptatum provident rem.",
        completed: false,
    },
});
