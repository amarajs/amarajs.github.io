todos

    // clear textbox on item added
    .add(events(Selectors.APP, () => ({
        'add-todo': (e) => {
            e.currentTarget.querySelector(Selectors.TEXTBOX).value = '';
            e.dispatch(Actions.valid(false));
        }
    })));
