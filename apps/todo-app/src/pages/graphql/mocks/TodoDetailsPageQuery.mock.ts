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
        id: "d0305ed2-456c-44e1-9b20-e85b698d2cbf";
        title: "Quidem nesciunt est dolorem.";
        completed: false;
    };
};

export const aTodoDetailsPage = createBuilder<TodoDetailsPage>({
    __typename: "Query",
    todo: {
        __typename: "Todo",
        id: "d0305ed2-456c-44e1-9b20-e85b698d2cbf",
        title: "Quidem nesciunt est dolorem.",
        completed: false,
    },
});
