todos

    // keyboard behaviors for accessibility
    
    // autofocus the textbox and give it a hotkey
    .add(events(Selectors.TEXTBOX, () => ({
        'amara:apply': (e) => {
            e.target.setAttribute('autofocus', '');
            e.target.setAttribute('accesskey', 'n');
            e.target.focus();
        }
    })))

    // item tab index 1/2 - setting initially focused item
    .add(events(Selectors.TODOITEM, () => ({
        'amara:apply': (e) => {
            const list = e.target.closest(Selectors.TODOLIST);
            const items = list.querySelectorAll(Selectors.TODOITEM);
            const index = Array.prototype.indexOf.call(items, e.target);
            if (index === 0) e.target.setAttribute('tabindex', '0');
        }
    })))

    // item tab index 2/2 - clearing focused item
    .add(events(Selectors.TODOLIST, () => ({
        'rem-todo': (e) => {
            const list = e.currentTarget;
            const index = e.detail.payload;
            const items = list.querySelectorAll(Selectors.TODOITEM);
            const item = items[index];
            if (!item.hasAttribute('tabindex')) return;
            const next = item.nextElementSibling || item.previousElementSibling;
            if (next) {
                list.setAttribute('aria-activedescendant', next.id);
                next.setAttribute('tabindex', '0');
                next.focus();
            } else {
                list.removeAttribute('aria-activedescendant');
                document.querySelector(Selectors.TEXTBOX).focus();
            }
        }
    })))

    // enter in textbox adds todo item
    .add(events(Selectors.TEXTBOX, () => ({
        'keydown.enter': (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.target.closest(Selectors.APP)
                .querySelector(Selectors.ADDTODO)
                .click();
        }
    })))

    // update aria-activedescendant based on previous item and available items
    .add(events(
        Selectors.TODOLIST,
        {todos: ({state}) => state.todos},
        ({todos}) => ({
            'amara:apply': (e) => {
                const list = e.target;
                const prev = list.getAttribute('aria-activedescendant');
                const curr = list.querySelector('#' + (prev || 'dne'));
                if (!todos.length) {
                    // clear active item if no items in list
                    list.removeAttribute('aria-activedescendant');
                } else if (!prev || !curr) {
                    // set first item active if no previous item was set
                    // set first item active if previous item no longer exists
                    list.setAttribute('aria-activedescendant', 'todo-' + todos[0].id);
                }
            }
        })
    ))

    // navigate the list using the keyboard (arrows, home, end, page up, page down)
    .add(events(Selectors.TODOLIST, () => ({
        keydown: (e) => {
            const list = e.currentTarget;
            const prev = list.getAttribute('aria-activedescendant');
            const curr = list.querySelector('#' + (prev || 'dne'));
            const items = list.querySelectorAll(Selectors.TODOITEM);
            let index = Array.prototype.indexOf.call(items, curr);
            if (index < 0) index = Math.min(0, items.length - 1);
            if (index < 0) return; // no items in list
            switch (e.key.toLowerCase()) {
            case 'home':
                index = 0;
                break;
            case 'end':
                index = items.length - 1;
                break;
            case 'pagedown':
                index = Math.min(index + 10, items.length - 1);
                break;
            case 'pageup':
                index = Math.max(index - 10, 0);
                break;
            case 'arrowup':
            case 'arrowleft':
            case 'up':
            case 'left':
                index -= 1;
                break;
            case 'arrowdown':
            case 'arrowright':
            case 'down':
            case 'right':
                index += 1;
                break;
            default:
                return;
            }
            index = (index + items.length) % items.length;
            curr && curr.removeAttribute('tabindex');
            items[index].setAttribute('tabindex', '0');
            items[index].focus();
            list.setAttribute('aria-activedescendant', items[index].id);
            e.preventDefault();
            e.stopPropagation();
        }
    })))

    // delete key should delete current item
    .add(events(Selectors.TODOLIST, () => ({
        ['keydown.delete ' + Selectors.TODOITEM]: (e) => {
            e.target.querySelector(Selectors.DELTODO).click();
            e.preventDefault();
            e.stopPropagation();
        }
    })))

    // delete button should not be in tab order (not helpful to keyboard users)
    .add(events(Selectors.DELTODO, () => ({
        'amara:apply': (e) => {
            e.target.setAttribute('tabindex', '-1');
        }
    })))

    // update aria-labels to explain new keyboard behaviors 1/2
    .add(events(Selectors.TEXTBOX, () => ({
        'amara:apply': (e) => {
            e.target.setAttribute('aria-label', 'add todo item then hit enter to add to list');
        }
    })))

    // update aria-labels to explain new keyboard behaviors 2/2
    .add(events(Selectors.TODOLIST, () => ({
        'amara:apply': (e) => {
            e.target.setAttribute('aria-label', 'use keys to navigate and delete items');
        }
    })));