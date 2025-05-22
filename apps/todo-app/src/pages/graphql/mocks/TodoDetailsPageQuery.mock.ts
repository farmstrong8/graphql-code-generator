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

type TodoDetailsPageAsTodoQuery = {
  "__typename": "Query",
  "todo": {
    "__typename": "Todo",
    "id": "3d59e2f3-e725-455e-a535-7c084873183b",
    "title": "Ut minus dolorem recusandae est vitae aut.",
    "completed": true
  }
};
  
  export const aTodoDetailsPageAsTodoQuery = createBuilder<TodoDetailsPageAsTodoQuery>({
  "__typename": "Query",
  "todo": {
    "__typename": "Todo",
    "id": "3d59e2f3-e725-455e-a535-7c084873183b",
    "title": "Ut minus dolorem recusandae est vitae aut.",
    "completed": true
  }
});

type TodoDetailsPageAsErrorQuery = {
  "__typename": "Query",
  "todo": {
    "__typename": "Error",
    "message": "Numquam vero reiciendis ut dolore eaque molestiae."
  }
};
  
  export const aTodoDetailsPageAsErrorQuery = createBuilder<TodoDetailsPageAsErrorQuery>({
  "__typename": "Query",
  "todo": {
    "__typename": "Error",
    "message": "Numquam vero reiciendis ut dolore eaque molestiae."
  }
});