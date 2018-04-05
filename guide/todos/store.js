let counter = 0,
    initialState = {
        valid: false,
        todos: []
    };

try {
    let last, state = JSON.parse(localStorage.getItem('amara-todos'));
    if (state) {
        initialState = state;
        last = initialState.todos[initialState.todos.length - 1];
        counter = last? last.id : counter;
        initialState.valid = false;
    }
} catch (e) {}

const store = Redux.createStore((state = initialState, action) => {
    switch (action.type) {
    case 'set-valid':
        return {todos: state.todos, valid: action.payload};
    case 'add-todo':
        return {valid: state.valid, todos: state.todos.concat({id: ++counter,text: action.payload})};
    case 'rem-todo':
        const todos = state.todos.concat();
        todos.splice(action.payload, 1);
        return {valid: state.valid, todos};
    case 'toggle-todo':
        return {valid: state.valid, todos: state.todos.map((todo, index) => {
            if (index === action.payload)
                return Object.assign(todo, {done: !todo.done});
            return todo;
        })};
    case 'update':
        const {index, names, values} = action.payload;
        const items = state.todos.concat();
        const i = items.findIndex(({id}) => id === index);
        const todo = Object.assign({}, items[i]);
        names.forEach((name, index) => todo[name] = values[index]);
        items.splice(i, 1, todo);
        return {valid: state.value, todos: items};
    }
    return state;
});

(function() {
    let lastState = store.getState();
    store.subscribe(() => {
        try {
            const state = store.getState();
            if (state !== lastState) {
                lastState = state;
                localStorage.setItem('amara-todos', JSON.stringify(state));
            }
        } catch (e) {}
    });
})();

const Actions = {
    add: (text) => ({type: 'add-todo', payload: text}),
    valid: (valid) => ({type: 'set-valid', payload: valid}),
    delete: (index) => ({type: 'rem-todo', payload: index}),
    toggle: (index) => ({type: 'toggle-todo', payload: index}),
    navigate: (target, route) => ({type: 'router:navigate', payload: {target, route}}),
    update: (index, names, values) => ({type: 'update', payload: {index, names, values}})
};