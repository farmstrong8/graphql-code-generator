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
    "id": "11495c2e-0379-4834-80e4-e8841097bc73",
    "title": "Temporibus ut magnam quia hic magnam ut non.",
    "completed": true
  }
};
  
  export const aToggleTodoMutation = createBuilder<ToggleTodoMutation>({
  "__typename": "Mutation",
  "toggleTodo": {
    "__typename": "Todo",
    "id": "11495c2e-0379-4834-80e4-e8841097bc73",
    "title": "Temporibus ut magnam quia hic magnam ut non.",
    "completed": true
  }
});