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
    "id": "48dc8368-f81d-4dfb-9607-4d5e17352ecf",
    "title": "Sunt corrupti odit suscipit pariatur.",
    "completed": true
  }
};
  
  export const aAddTodoMutation = createBuilder<AddTodoMutation>({
  "__typename": "Mutation",
  "addTodo": {
    "__typename": "Todo",
    "id": "48dc8368-f81d-4dfb-9607-4d5e17352ecf",
    "title": "Sunt corrupti odit suscipit pariatur.",
    "completed": true
  }
});