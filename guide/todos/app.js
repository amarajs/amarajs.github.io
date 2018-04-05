const todos = Amara([
    AmaraDOM(virtualDom),
    AmaraRouter(),
    AmaraCSS(),
    AmaraEvents(),
    AmaraBrowser(),
    AmaraRedux(store)
]);

const Selectors = {
    APP: 'main',
    TEXTBOX: 'input#todo',
    ADDTODO: 'button#add',
    DELTODO: 'button.del',
    TODOLIST: 'ul#todos',
    TODOITEM: 'ul#todos li',
    DETAILS: 'div#details',
    DETAILS_ACTIVE: 'div#details[route^="todos/"]'
}

todos.bootstrap(document.querySelector('main'));