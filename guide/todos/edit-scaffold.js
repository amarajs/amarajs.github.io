todos

    // create edit form scaffold
    .add(dom(
        Selectors.DETAILS_ACTIVE,
        { todo: routeTodo },
        ({todo}) => todo &&
            h('form#edit.pure-form.pure-form-aligned',
                h('fieldset',
                    h('legend#edit-label', 'Edit Todo'))) || null
    ))

    .add(style('form#edit label', () => ({
        'display': 'flex',
        'align-items': 'center',
        'justify-content': 'center'
    })))

    .add(style('form#edit label > span', () => ({
        'width': '20%',
        'text-align': 'right'
    })))

    .add(style('form#edit label > input', () => ({
        'width': '70%',
        'margin-left': '1em'
    })));