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

type TodoDetailsPage = {
    __typename: "Query";
    todo: {
        __typename: "Todo";
        id: "60fa0d3e-ead1-4faf-9942-9b2dafd4574e";
        title: "Minima doloribus et.";
        completed: true;
    };
};

export const aTodoDetailsPage = createBuilder<TodoDetailsPage>({
    __typename: "Query",
    todo: {
        __typename: "Todo",
        id: "60fa0d3e-ead1-4faf-9942-9b2dafd4574e",
        title: "Minima doloribus et.",
        completed: true,
    },
});
