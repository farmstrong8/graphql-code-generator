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

type TodosPageQuery = {
  "__typename": "Query",
  "todos": {
    "__typename": "Todo",
    "id": "1b8e5267-1d82-4ac4-9d58-93da4746cbb4",
    "title": "Voluptatum ratione fugiat exercitationem sint.",
    "completed": true
  }
};
  
  export const aTodosPageQuery = createBuilder<TodosPageQuery>({
  "__typename": "Query",
  "todos": {
    "__typename": "Todo",
    "id": "1b8e5267-1d82-4ac4-9d58-93da4746cbb4",
    "title": "Voluptatum ratione fugiat exercitationem sint.",
    "completed": true
  }
});