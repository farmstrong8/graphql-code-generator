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

type TodoDetailsPageQueryAsTodoTodo = {
    __typename: "Todo";
    id: string;
    title: string;
    completed: boolean;
};

export const aTodoDetailsPageQueryAsTodoTodo =
    createBuilder<TodoDetailsPageQueryAsTodoTodo>({
        __typename: "Todo",
        id: "635759f6-2910-45c8-b2ed-6717cab6315d",
        title: "Est suscipit nostrum cumque ad.",
        completed: true,
    });

type TodoDetailsPageQueryAsTodo = {
    __typename: "Query";
    todo: TodoDetailsPageQueryAsTodoTodo;
};

export const aTodoDetailsPageQueryAsTodo =
    createBuilder<TodoDetailsPageQueryAsTodo>({
        __typename: "Query",
        todo: aTodoDetailsPageQueryAsTodoTodo(),
    });

type TodoDetailsPageQueryAsErrorError = {
    __typename: "Error";
    message: string;
};

export const aTodoDetailsPageQueryAsErrorError =
    createBuilder<TodoDetailsPageQueryAsErrorError>({
        __typename: "Error",
        message: "Aut ipsum aspernatur pariatur dolore.",
    });

type TodoDetailsPageQueryAsError = {
    __typename: "Query";
    todo: TodoDetailsPageQueryAsErrorError;
};

export const aTodoDetailsPageQueryAsError =
    createBuilder<TodoDetailsPageQueryAsError>({
        __typename: "Query",
        todo: aTodoDetailsPageQueryAsErrorError(),
    });
