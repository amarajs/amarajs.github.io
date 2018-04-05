todos

    // dispatch add action on click
    .add(events(Selectors.APP, () => ({
        ['click ' + Selectors.ADDTODO]: (e) => {
            const todo = document.querySelector(Selectors.TEXTBOX);
            e.dispatch(Actions.add(todo.value));
            e.preventDefault();
            e.stopPropagation();
        }
    })));
