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
    "id": "f507e324-418e-4a38-9ba6-a70ed175022a",
    "title": "Quia natus in sit aut et consequatur rerum animi qui.",
    "completed": true
  }
};
  
  export const aAddTodoMutation = createBuilder<AddTodoMutation>({
  "__typename": "Mutation",
  "addTodo": {
    "__typename": "Todo",
    "id": "f507e324-418e-4a38-9ba6-a70ed175022a",
    "title": "Quia natus in sit aut et consequatur rerum animi qui.",
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
    "id": "a846e797-f2ec-4e37-bcc8-f4191c48514d",
    "title": "Distinctio eos et.",
    "completed": true
  }
};
  
  export const aTodoDetailsPageQuery = createBuilder<TodoDetailsPageQuery>({
  "__typename": "Query",
  "todo": {
    "__typename": "Todo",
    "id": "a846e797-f2ec-4e37-bcc8-f4191c48514d",
    "title": "Distinctio eos et.",
    "completed": true
  }
});

type TodosPageQuery = {
  "__typename": "Query",
  "todos": {
    "__typename": "Todo",
    "id": "b11173ac-b1f8-414b-a07c-1632fa4b5cf1",
    "title": "Officia aliquid odio eius.",
    "completed": true,
    "dueAt": "1987-12-28"
  }
};
  
  export const aTodosPageQuery = createBuilder<TodosPageQuery>({
  "__typename": "Query",
  "todos": {
    "__typename": "Todo",
    "id": "b11173ac-b1f8-414b-a07c-1632fa4b5cf1",
    "title": "Officia aliquid odio eius.",
    "completed": true,
    "dueAt": "1987-12-28"
  }
});

type ToggleTodoMutation = {
  "__typename": "Mutation",
  "toggleTodo": {
    "__typename": "Todo",
    "id": "a07c0622-a7c2-4703-aaea-ea70f9f0d4ec",
    "title": "Ex eaque facere delectus quidem voluptatem porro maiores et.",
    "completed": true
  }
};
  
  export const aToggleTodoMutation = createBuilder<ToggleTodoMutation>({
  "__typename": "Mutation",
  "toggleTodo": {
    "__typename": "Todo",
    "id": "a07c0622-a7c2-4703-aaea-ea70f9f0d4ec",
    "title": "Ex eaque facere delectus quidem voluptatem porro maiores et.",
    "completed": true
  }
});