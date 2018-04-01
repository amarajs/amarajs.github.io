todos

    // add save button
    .add(dom('form#edit fieldset', () => h('button#save.pure-button.pure-button-primary', 'Save')))

    .add(style('#save', () => ({
        'float': 'right',
        'margin-top': '1em'
    })))

    .add(events(
        '#save',
        { index: ({routeParams}) => routeParams.index },
        ({index}) => ({
            click: (e) => {
                const inputs = e.target.closest('form').querySelectorAll('input');
                const names = Array.prototype.map.call(inputs, i => i.name);
                const values = Array.prototype.map.call(inputs, i => i.value);
                e.dispatch(Actions.update(index, names, values));
                e.preventDefault();
                e.stopPropagation();
            }
        })
    ));