todos

    // styles

    .add(style(Selectors.APP, () => ({
        'font-size': 'large',
        'margin': '0 auto',
        'text-align': 'center'
    })))

    .add(style(Selectors.TEXTBOX, () => ({
        'width': '60%',
        'min-width': '8em',
        'margin': '1em .5em',
        'display': 'inline-block'
    })))

    .add(style([Selectors.TODOLIST, Selectors.DETAILS], () => ({
        'text-align': 'left',
        'margin': '0 1em 1em 1em'
    })));
