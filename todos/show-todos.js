todos

    // show todos list
    .add(dom(
        Selectors.TODOLIST,
        {todos: ({state}) => state.todos || []},
        ({todos}) => todos.map((todo) =>
            h('li#todo-' + todo.id, {
                key: todo.id,
                attributes: { 'item-id': todo.id }
            }, h('span', todo.text)))
    ));
