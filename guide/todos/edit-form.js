todos

    // edit existing text
    .add(dom(
        'form#edit fieldset',
        { todo: routeTodo },
        ({todo}) => h('label', [
            h('span', 'Text'),
            h('input', {
                name: 'text',
                value: todo && todo.text || '',
                attributes: { accesskey: 'e' }
            })
        ])
    ))

    // add due date
    .add(dom(
        'form#edit fieldset',
        { todo: routeTodo },
        ({todo}) => h('label', [
            h('span', 'Deadline'),
            h('input', {
                name: 'deadline',
                type: 'date',
                value: todo && todo.deadline || ''
            })
        ])
    ))

    // add assigned to
    .add(dom(
        'form#edit fieldset',
        { todo: routeTodo },
        ({todo}) => h('label', [
            h('span', 'Assignee'),
            h('input', {
                name: 'assignees',
                value: todo && todo.assignees || ''
            })
        ])
    ))

    // focus name field whenever new item activated
    .add(events(
        'input[name="text"]',
        { index: ({routeParams}) => routeParams.index },
        (/* ignored */) => ({
            'amara:apply': (e) => {
                e.target.focus();
                e.target.select();
            }
        })
    ))
    
    ;