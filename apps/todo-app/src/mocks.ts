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
    "id": "753c2298-2370-4212-a847-4a297e84acbb",
    "title": "Sit nemo numquam facere culpa asperiores.",
    "completed": true
  }
};
  
  export const aAddTodoMutation = createBuilder<AddTodoMutation>({
  "__typename": "Mutation",
  "addTodo": {
    "__typename": "Todo",
    "id": "753c2298-2370-4212-a847-4a297e84acbb",
    "title": "Sit nemo numquam facere culpa asperiores.",
    "completed": true
  }
});

type DeleteTodoMutation = {
  "__typename": "Mutation",
  "deleteTodo": true
};
  
  export const aDeleteTodoMutation = createBuilder<DeleteTodoMutation>({
  "__typename": "Mutation",
  "deleteTodo": true
});

type TodoDetailsPageQuery = {
  "__typename": "Query",
  "todo": {
    "__typename": "Todo",
    "id": "fbe2c725-5c15-44dc-9ba8-0b57daa65834",
    "title": "Rerum nulla est sed praesentium temporibus iste et provident reprehenderit.",
    "completed": true
  }
};
  
  export const aTodoDetailsPageQuery = createBuilder<TodoDetailsPageQuery>({
  "__typename": "Query",
  "todo": {
    "__typename": "Todo",
    "id": "fbe2c725-5c15-44dc-9ba8-0b57daa65834",
    "title": "Rerum nulla est sed praesentium temporibus iste et provident reprehenderit.",
    "completed": true
  }
});

type TodosPageQuery = {
  "__typename": "Query",
  "todos": {
    "__typename": "Todo",
    "id": "ea89daf5-cf02-420f-8b6c-5ed4f10bde7c",
    "title": "Fuga sunt sint vel officiis adipisci.",
    "completed": true
  }
};
  
  export const aTodosPageQuery = createBuilder<TodosPageQuery>({
  "__typename": "Query",
  "todos": {
    "__typename": "Todo",
    "id": "ea89daf5-cf02-420f-8b6c-5ed4f10bde7c",
    "title": "Fuga sunt sint vel officiis adipisci.",
    "completed": true
  }
});

type ToggleTodoMutation = {
  "__typename": "Mutation",
  "toggleTodo": {
    "__typename": "Todo",
    "id": "c318f077-d1db-4dfe-8a07-ff34cabb9c88",
    "title": "Ut odio quae veniam iure.",
    "completed": true
  }
};
  
  export const aToggleTodoMutation = createBuilder<ToggleTodoMutation>({
  "__typename": "Mutation",
  "toggleTodo": {
    "__typename": "Todo",
    "id": "c318f077-d1db-4dfe-8a07-ff34cabb9c88",
    "title": "Ut odio quae veniam iure.",
    "completed": true
  }
});