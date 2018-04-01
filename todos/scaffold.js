
todos

    // scaffold
    .add(dom(Selectors.APP, () => ([
        h('h1', 'AmaraJS / TODO'),
        h('form#create.pure-form', h('fieldset')),
        h(Selectors.TODOLIST),
        h(Selectors.DETAILS)
    ])))

    .add(dom('form#create fieldset', () => ([
        h(Selectors.TEXTBOX, {
            type: 'text',
            attributes: { placeholder: 'take a note' }
        }),
        h(Selectors.ADDTODO, {attributes: {
            tabindex: '-1',
            class: 'pure-button pure-button-primary'
        }}, 'Add')
    ])));
