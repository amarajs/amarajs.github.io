const todoFromTarget = ({state, target}) => {
    const todos = state.todos;
    const item = target.closest(Selectors.TODOITEM);
    const list = target.closest(Selectors.TODOLIST);
    const items = list.querySelectorAll(Selectors.TODOITEM);
    const index = Array.prototype.indexOf.call(items, item);
    return todos[index];
};

todos

    // add checkbox
    .add(dom(
        Selectors.TODOITEM,
        { todo: todoFromTarget },
        ({todo}) => {
            return h('input', {
                type: 'checkbox',
                checked: !!(todo && todo.done),
                attributes: {
                    'aria-label': todo && todo.done ? 'done' : 'not done',
                    'tabindex': '-1' // no keyboard focus
                }
            });
        }
    ))

    // dispatch toggle action on checkbox clicked or space keydown
    .add(events(Selectors.TODOLIST, () => ({
        'click input[type="checkbox"]': (e) => {
            const list = e.currentTarget;
            const item = e.target.closest('li');
            const items = list.querySelectorAll(Selectors.TODOITEM);
            const index = Array.prototype.indexOf.call(items, item);
            if (index >= 0) {
                e.dispatch(Actions.toggle(index))
                e.stopImmediatePropagation();
            }
        },
        ['keydown.space ' + Selectors.TODOITEM]: (e) => {
            e.target.querySelector('input').click();
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    })))

    .add(style(
        Selectors.TODOITEM + ' span',
        { done: (params) => {
            const todo = todoFromTarget(params);
            return todo && todo.done || false;
        } },
        ({done}) => done && {'text-decoration': 'line-through'} || {}
    ));