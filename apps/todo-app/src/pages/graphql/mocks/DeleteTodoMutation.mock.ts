import * as Types from '../../../types.generated';

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



type DeleteTodoMutation = {
  "__typename": "Mutation",
  deleteTodo: boolean
};

export const aDeleteTodoMutation = createBuilder<DeleteTodoMutation>({
  "__typename": "Mutation",
  deleteTodo: false
});