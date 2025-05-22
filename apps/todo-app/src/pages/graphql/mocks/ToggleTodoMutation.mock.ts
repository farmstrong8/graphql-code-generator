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
    "id": "d750ac26-d986-4981-bc3e-a0de637346c3",
    "title": "Quasi recusandae qui ea corporis aut at cupiditate.",
    "completed": true
  }
};
  
  export const aToggleTodoMutation = createBuilder<ToggleTodoMutation>({
  "__typename": "Mutation",
  "toggleTodo": {
    "__typename": "Todo",
    "id": "d750ac26-d986-4981-bc3e-a0de637346c3",
    "title": "Quasi recusandae qui ea corporis aut at cupiditate.",
    "completed": true
  }
});