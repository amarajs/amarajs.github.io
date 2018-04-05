todos

    // aria roles, labels, and states for accessibility

    .add(events(Selectors.TEXTBOX, () => ({
        'amara:apply': (e) => {
            e.target.setAttribute('aria-label', 'add todo item');
        }
    })))

    .add(events([Selectors.ADDTODO, Selectors.DELTODO], () => ({
        'amara:apply': (e) => {
            e.target.setAttribute('role', 'presentation');
            e.target.setAttribute('aria-hidden', 'true');
        }
    })))

    .add(events(Selectors.DETAILS, () => ({
        'amara:apply': (e) => {
            e.target.setAttribute('role', 'form');
            e.target.setAttribute('aria-labelledby', 'edit-label');
        }
    })))

    .add(events(Selectors.TODOLIST, () => ({
        'amara:apply': (e) => {
            e.target.setAttribute('role', 'listbox'); // for multiselect
        }
    })))

    .add(events(Selectors.TODOITEM, () => ({
        'amara:add': (e) => {
            e.target.setAttribute('role', 'option'); // for multiselect
        }
    })));