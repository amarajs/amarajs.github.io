todos

    // remove functionality

    .add(dom(Selectors.TODOITEM, () =>
        h('button', {attributes: {
            class: 'del pure-button button-error button-xsmall'
        }}, '✖')))

    .add(events(Selectors.TODOLIST, () => ({
        ['click ' + Selectors.DELTODO]: (e) => {
            const list = e.currentTarget;
            const item = e.target.closest(Selectors.TODOITEM);
            const items = list.querySelectorAll(Selectors.TODOITEM);
            const index = Array.prototype.indexOf.call(items, item);
            if (index >= 0) {
                e.preventDefault();
                e.stopImmediatePropagation();
                e.dispatch(Actions.delete(index));
            }
        }
    })));
