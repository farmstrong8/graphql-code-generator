import * as Types from '../../../types.generated';

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

type AddTodoMutation = {
  "__typename": "Mutation",
  "addTodo": {
    "__typename": "Todo",
    "id": "76a79137-e15f-4ccc-a1cf-f6a1e43add73",
    "title": "Quaerat delectus sapiente sed nemo est.",
    "completed": true
  }
};
  
  export const aAddTodoMutation = createBuilder<AddTodoMutation>({
  "__typename": "Mutation",
  "addTodo": {
    "__typename": "Todo",
    "id": "76a79137-e15f-4ccc-a1cf-f6a1e43add73",
    "title": "Quaerat delectus sapiente sed nemo est.",
    "completed": true
  }
});