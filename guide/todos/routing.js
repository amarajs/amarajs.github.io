const routeTodo = ({state, routeParams}) =>
    state.todos.find(({id}) =>
        id === routeParams.index);

todos

    // routing

    .add(routes(Selectors.DETAILS, () => ['todos/:index'] ))

    // visually indicate items are navigable
    .add(style(Selectors.TODOITEM, () => ({
        'cursor': 'pointer'
    })))

    // identify text as route links for accessibility
    .add(events(Selectors.TODOITEM, () => ({
        'amara:add': (e) => {
            e.target.querySelector('span').setAttribute('role', 'link'); // route link
        }
    })))

    // navigate to item details when item clicked
    .add(events(Selectors.TODOLIST, () => ({
        click: (e) => {
            const item = e.target.closest('li');
            const id = item.getAttribute('item-id');
            e.preventDefault();
            e.stopImmediatePropagation();
            e.dispatch(Actions.navigate(Selectors.DETAILS, 'todos/' + id));
        }
    })))

    // this is not the recommended way of applying styles
    // based on CSS class names; use stylesheets for that
    .add(style(Selectors.TODOITEM + '.selected', () => ({
        'background': '#0078e7',
        'color': '#fff'
    })))

    // make sure route item is selected when refreshing or
    // loading from bookmark
    .add(events(
        Selectors.DETAILS,
        { index: ({routeParams}) => routeParams.index },
        ({index}) => ({
            'amara:apply': (e) => {
                const list = document.querySelector(Selectors.TODOLIST);
                const items = list.querySelectorAll(Selectors.TODOITEM);
                const item = document.querySelector(`li[item-id="${index}"]`);
                Array.prototype.forEach.call(items, li =>
                    li.classList[item === li ? 'add' : 'remove']('selected'));
            }
        })
    ))

    // navigate to item details when enter key pressed
    .add(events(Selectors.TODOLIST, () => ({
        ['keydown.enter ' + Selectors.TODOITEM]: (e) => {
            e.target.querySelector('span').click();
            e.preventDefault();
            e.stopPropagation();
        }
    })));