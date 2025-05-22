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
    "id": "dd47a064-8000-4c58-adf3-13d4989c6a44",
    "title": "Error dolores corporis nobis sequi.",
    "completed": true
  }
};
  
  export const aAddTodoMutation = createBuilder<AddTodoMutation>({
  "__typename": "Mutation",
  "addTodo": {
    "__typename": "Todo",
    "id": "dd47a064-8000-4c58-adf3-13d4989c6a44",
    "title": "Error dolores corporis nobis sequi.",
    "completed": true
  }
});

type AuthorFragmentFragment = {
  "__typename": "Author",
  "id": "a77929d3-b2e3-4bee-96e1-d474ae2813b3",
  "name": "Deleniti numquam dolor aspernatur rem hic deserunt molestiae asperiores ipsam."
};
  
  export const aAuthorFragmentFragment = createBuilder<AuthorFragmentFragment>({
  "__typename": "Author",
  "id": "a77929d3-b2e3-4bee-96e1-d474ae2813b3",
  "name": "Deleniti numquam dolor aspernatur rem hic deserunt molestiae asperiores ipsam."
});

type DeleteTodoMutation = {
  "__typename": "Mutation",
  "deleteTodo": true
};
  
  export const aDeleteTodoMutation = createBuilder<DeleteTodoMutation>({
  "__typename": "Mutation",
  "deleteTodo": true
});

type TodoDetailsPageAsTodoQuery = {
  "__typename": "Query",
  "todo": {
    "__typename": "Todo",
    "id": "c30ee61d-a543-410b-889b-4ce5fc58682c",
    "title": "Eos quo unde iure molestiae.",
    "completed": true
  }
};
  
  export const aTodoDetailsPageAsTodoQuery = createBuilder<TodoDetailsPageAsTodoQuery>({
  "__typename": "Query",
  "todo": {
    "__typename": "Todo",
    "id": "c30ee61d-a543-410b-889b-4ce5fc58682c",
    "title": "Eos quo unde iure molestiae.",
    "completed": true
  }
});

type TodoDetailsPageAsErrorQuery = {
  "__typename": "Query",
  "todo": {
    "__typename": "Error",
    "message": "Tempore cumque hic iste atque."
  }
};
  
  export const aTodoDetailsPageAsErrorQuery = createBuilder<TodoDetailsPageAsErrorQuery>({
  "__typename": "Query",
  "todo": {
    "__typename": "Error",
    "message": "Tempore cumque hic iste atque."
  }
});

type TodosPageQuery = {
  "__typename": "Query",
  "todos": {
    "__typename": "Todo",
    "id": "aca2ab85-5906-40e6-9fbb-e5b754d82fcc",
    "title": "Quibusdam qui quam architecto.",
    "completed": true,
    "dueAt": "1998-12-05",
    "author": null
  }
};
  
  export const aTodosPageQuery = createBuilder<TodosPageQuery>({
  "__typename": "Query",
  "todos": {
    "__typename": "Todo",
    "id": "aca2ab85-5906-40e6-9fbb-e5b754d82fcc",
    "title": "Quibusdam qui quam architecto.",
    "completed": true,
    "dueAt": "1998-12-05",
    "author": null
  }
});

type ToggleTodoMutation = {
  "__typename": "Mutation",
  "toggleTodo": {
    "__typename": "Todo",
    "id": "7872d245-efaf-480c-8b5a-c020feef3308",
    "title": "Earum est et hic eligendi velit.",
    "completed": true
  }
};
  
  export const aToggleTodoMutation = createBuilder<ToggleTodoMutation>({
  "__typename": "Mutation",
  "toggleTodo": {
    "__typename": "Todo",
    "id": "7872d245-efaf-480c-8b5a-c020feef3308",
    "title": "Earum est et hic eligendi velit.",
    "completed": true
  }
});