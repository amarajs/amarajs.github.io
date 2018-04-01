todos

    // disable add button if input empty (1/2)
    .add(events(Selectors.TEXTBOX, {
        valid: ({state}) => state.valid
    }, ({valid}) => ({
        input: (e) => {
            e.stopPropagation();
            const newValid = e.target.value.length > 0;
            newValid !== valid && e.dispatch(Actions.valid(newValid));
        }
    })))

    // disable add button if input empty (2/2)
    .add(events(
        Selectors.ADDTODO,
        {valid: ({state}) => state.valid},
        ({valid}) => ({
            'amara:apply': (e) => {
                valid ? e.target.removeAttribute('disabled')
                      : e.target.setAttribute('disabled', '');
            }
    })));
