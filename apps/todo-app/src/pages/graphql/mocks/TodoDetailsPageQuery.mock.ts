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

type TodoDetailsPageQuery = {
  "__typename": "Query",
  "todo": {
    "__typename": "Todo",
    "id": "4dc2cf6b-cfe8-4156-a4b2-16394f762d98",
    "title": "Consequatur consequatur hic in autem exercitationem quis nam fugiat.",
    "completed": true
  }
};
  
  export const aTodoDetailsPageQuery = createBuilder<TodoDetailsPageQuery>({
  "__typename": "Query",
  "todo": {
    "__typename": "Todo",
    "id": "4dc2cf6b-cfe8-4156-a4b2-16394f762d98",
    "title": "Consequatur consequatur hic in autem exercitationem quis nam fugiat.",
    "completed": true
  }
});