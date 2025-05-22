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

type ToggleTodoMutation = {
  "__typename": "Mutation",
  "toggleTodo": {
    "__typename": "Todo",
    "id": "77cbe290-7593-452d-9cdd-261e32b3b919",
    "title": "Consequatur facilis consequatur adipisci aut corrupti.",
    "completed": true
  }
};
  
  export const aToggleTodoMutation = createBuilder<ToggleTodoMutation>({
  "__typename": "Mutation",
  "toggleTodo": {
    "__typename": "Todo",
    "id": "77cbe290-7593-452d-9cdd-261e32b3b919",
    "title": "Consequatur facilis consequatur adipisci aut corrupti.",
    "completed": true
  }
});