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
        id: "36a11624-6827-422f-8f95-6e641013fb5d",
        title: "Id mollitia pariatur distinctio excepturi.",
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
        message: "Quia quia reiciendis itaque.",
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
