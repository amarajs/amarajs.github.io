const guide = Amara([
    AmaraDOM(virtualDom),
    AmaraRouter(),
    AmaraCSS(),
    AmaraEvents(),
    AmaraBrowser()
]);

const steps = [
    'intro',
    'scaffold',
    'click',
    'show-todos',
    'validation',
    'reset-form',
    'styles',
    'remove',
    'aria',
    'keyboard',
    'toggle',
    'routing',
    'edit-scaffold',
    'edit-form',
    'save',
    'end'
];

const files = {
    'intro': ['todos/store.js', 'todos/app.js'],
    'scaffold': ['todos/scaffold.js'],
    'click': ['todos/click.js'],
    'show-todos': ['todos/show-todos.js'],
    'validation': ['todos/validation.js'],
    'reset-form': ['todos/reset-form.js'],
    'styles': ['todos/styles.js', 'todos/style.css'],
    'remove': ['todos/remove.js'],
    'aria': ['todos/aria.js'],
    'keyboard': ['todos/keyboard.js'],
    'toggle': ['todos/toggle.js'],
    'routing': ['todos/routing.js'],
    'edit-scaffold': ['todos/edit-scaffold.js'],
    'edit-form': ['todos/edit-form.js'],
    'save': ['todos/save.js']
};

const downloaded = [];

const isJS = /\.js$/;
const isCSS = /\.css$/;

function download(uri, next) {
    console.log('downloading', uri);
    if (isJS.test(uri)) {
        let script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = uri;
        script.onload = () => next();
        document.body.appendChild(script);
    } else if (isCSS.test(uri)) {
        let link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.href = uri;
        link.onload = () => next();
        document.head.appendChild(link);
    }
}

function downloadAll(uris, callback) {
    let uri = uris.shift();
    uri && download(uri, () => {
        uris.length ? downloadAll(uris, callback) : callback && callback();
    });
}

function getDownloadDOM(step) {
    return [
        h('p.downloaded.hide', 'Files downloaded!'),
        h('button.pure-button' + (files[step].length ? '' : '.hide'), {attributes: {download: true, step}}, 'Download ⤓')
    ];
}

function getContinueDOM(current, next) {
    return h('button.pure-button' + (files[current].length ? '.hide' : ''), {attributes: {continue: true, step: next}}, 'Next ➠');
}

guide

    .add(routes('aside', () => ['steps/:step']))

    // catch up to bookmark, if necessary
    .add(events(
        'aside[route^="steps/"]',
        { step: ({routeParams}) => routeParams.step },
        ({step}) => ({
            'amara:apply': (e) => {
                const toDownload = steps.concat();
                !function catchUp() {
                    const stepName = toDownload.shift();
                    stepName !== step && downloadAll(files[stepName], catchUp);
                }();
            }
        })
    ))

    // download files on button click
    .add(events('button[download][step]', () => ({
        'click': (e) => {
            e.preventDefault();
            e.stopPropagation();
            downloadAll(files[e.target.getAttribute('step')], () => {
                Array.prototype.forEach.call(
                    e.target.parentElement.querySelectorAll('.hide'),
                    el => el.classList.remove('hide')
                );
                e.target.classList.add('hide');
            });
        }
    })))

    // navigate to next step on button click
    .add(events('button[continue][step]', () => ({
        'click': (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dispatch({type: 'router:navigate', payload: {
                target: 'aside',
                route: 'steps/' + e.target.getAttribute('step')
            }});
        }
    })))

    // intro content
    .add(dom('aside:not([route])', () => [
        h('h2', 'Welcome!'),
        h('h3', 'Creating a TODO application in AmaraJS.'),
        h('p', ['When using AmaraJS to build web applications, developers write ', h('em', 'features'), ' not components.']),
        h('p.note', 'This walkthrough assumes you are familiar with basic AmaraJS concepts. If you\'re new to AmaraJS, you should visit our GitHub page now to learn more.'),
        h('p.note', 'Also, you may want to open your developer tools [F12] and switch to the network tab, so you can see what each file we download is doing.'),
        h('hr'),
        h('p', 'First, let\s bootstrap our TODO application by creating a new Amara instance, a new Redux store (for demo purposes only, you could use any state management library you want), and hooking up our Amara middleware.')
    ]
        .concat(getDownloadDOM(steps[0]))
        .concat([
            h('p.hide', 'Excellent! AmaraJS is now set up and has been bootstrapped.'),
            h('p.hide', 'Of course, you can\'t see anything in the page just yet. For that, we need to add our first features...')
        ])
        .concat(getContinueDOM(steps[0], steps[1]))
    ))

    // scaffold content
    .add(dom('aside[route="steps/scaffold"]', () => [
        h('h2', 'Scaffolding'),
        h('h3', 'Setting up the basic DOM structure.'),
        h('p', `A good first step in any AmaraJS web application is to set up your scaffold. These are the DOM elements you'll use as the foundation for your content.`),
        h('p', `For our TODO app, we'll need a textbox, a button, and a list where we can show our items.`),
        h('p.note', `We could use JSX to create our DOM elements, but in the interest of being as pure as possible, we'll use the excellent virtual-dom library. Of course, you can use JSX in your own applications and simply transpile to virtual-dom.`)
    ]
        .concat(getDownloadDOM('scaffold'))
        .concat([
            h('p.hide', `We'll worry about styling these elements later. Also, right now, clicking the button doesn't do anything -- we'll add that functionality next.`)
        ])
        .concat(getContinueDOM('scaffold', 'click'))
    ))

    // click content
    .add(dom('aside[route="steps/click"]', () => [
        h('h2', 'Events'),
        h('h3', 'Handling and dispatching actions.'),
        h('p', `Okay, now that we have a button, let's add some click behavior.`),
        h('p', `Our click handler will simply dispatch a Redux action to add whatever text we entered to the store.`)
    ]
        .concat(getDownloadDOM('click'))
        .concat([
            h('p.hide', `The click handler has been added. Go ahead and add a few TODO items before continuing.`),
            h('p.hide', [`Of course, we haven't implemented our feature to `, h('em', 'show'), ` our todos yet, so clicking the button appears to do nothing. Still, the items are there. If you want to verify your items were added, evaluate `, h('code', 'store.getState()'), ` in the developer console.`])
        ])
        .concat(getContinueDOM('click', 'show-todos'))
    ))

    // show-todos content
    .add(dom('aside[route="steps/show-todos"]', () => [
        h('h2', 'Showing Todos'),
        h('h3', 'Connecting content to Redux'),
        h('p', `Most applications are driven by state. AmaraJS has a middleware plugin to connect features to a Redux store. That means we can loop through the todos in our store and output them as list items in our scaffold.`)
    ]
        .concat(getDownloadDOM('show-todos'))
        .concat([
            h('p.hide', `You should see the items you created in the previous step appear automatically.`),
            h('p.hide', `Now that we have a very basic TODO application, let's implement some features that will make it really stand out.`)
        ])
        .concat(getContinueDOM('show-todos', 'validation'))
    ))

    // validation content
    .add(dom('aside[route="steps/validation"]', () => [
        h('h2', 'Basic Validation'),
        h('h3', 'Ensuring quality data.'),
        h('p', `Ideally, the user shouldn't be able to enter an empty TODO item.`),
        h('p', `To implement this feature, we'll add an input handler on the textbox to update our Redux store with the global valid status.`),
        h('p', `Our add button will listen for this add status to determine if it should be enabled or disabled.`)
    ]
        .concat(getDownloadDOM('validation'))
        .concat([
            h('p.hide', `Try typing some values in the textbox. If the textbox is empty, the add button should become disabled. If the textbox isn't empty, the button should be enabled.`),
            h('p.hide', `Now let's clean up the textbox when we add an item.`)
        ])
        .concat(getContinueDOM('validation', 'reset-form'))
    ))

    // reset-form content
    .add(dom('aside[route="steps/reset-form"]', () => [
        h('h2', 'Resetting the Form'),
        h('p', `There are many ways we could reset the textbox when an item is added. For this guide, we're going to take advantage of the fact that Redux actions are dispatched liked regular DOM events in AmaraJS.`),
        h('p', `Because DOM events bubble, we're going to attach a listener on our root application node that will reset the textbox whenever it sees an "add-todo" action.`)
    ]
        .concat(getDownloadDOM('reset-form'))
        .concat([
            h('p.hide', `Now try adding an item. The textbox should reset automatically.`)
        ])
        .concat(getContinueDOM('reset-form', 'styles'))
    ))

    // styles content
    .add(dom('aside[route="steps/styles"]', () => [
        h('h2', 'Adding Style'),
        h('p', `Let's add some CSS to make our application look nice.`)
    ]
        .concat(getDownloadDOM('styles'))
        .concat([
            h('p.hide', `If you're still watching the network tab, you'll notice that we've applied styles both through a stylesheet and through AmaraJS.`),
            h('p.hide', `Not everything needs to be implemented using AmaraJS. In fact, unless your styles need to be dynamic (e.g. based on application state), you should probably stick to using static CSS in a stylesheet.`)
        ])
        .concat(getContinueDOM('styles', 'remove'))
    ))

    // remove content
    .add(dom('aside[route="steps/remove"]', () => [
        h('h2', 'Removing Items'),
        h('h3', 'Cleaning up old items.'),
        h('p', `Adding items is important, but removing them is pretty useful, too.`),
        h('p', `Let's add a remove button to each list item.`),
        h('p.', `We don't need to modify our existing code that creates the list items. Instead, we'll just target the list item and say which new DOM we want to add. If we need to adjust positioning, that's what CSS is for.`)
    ]
        .concat(getDownloadDOM('remove'))
        .concat([
            h('p.hide', `Since we're creating the button, we may as well create the click handler, too.`),
            h('p.hide', `Our click handler will be attached the todo list (delegated) and simply dispatch an action when fired. That action will be picked up by our Redux plugin middleware and sent to our store.`),
            h('p.hide', `Go ahead and remove some of the items you previously created.`)
        ])
        .concat(getContinueDOM('remove', 'aria'))
    ))

    // aria content
    .add(dom('aside[route="steps/aria"]', () => [
        h('h2', 'ARIA/WCAG'),
        h('h3', 'Making our app accessible to users with disabilities.'),
        h('p', `Ensuring an application can be used by everyone isn't simple, especially when trying to retro-fit accessibility into existing components.`),
        h('p', `AmaraJS makes this work a bit easier. Simply target the elements you want to modify, and then add the appropriate attributes. If an attribute value is dynamic, you can hook into existing events and state to ensure your values remain correct.`)
    ]
        .concat(getDownloadDOM('aria'))
        .concat([
            h('p.hide', `We've just added some roles and labels to our DOM elements. Someone using our app with an accessible device will now have a much easier time understanding the layout and purpose of each element.`),
            h('p.hide', `We've also hidden some elements from disabled users that we don't want to be announced repeatedly. Instead, that functionality will be provided through keyboard shortcuts.`)
        ])
        .concat(getContinueDOM('aria', 'keyboard'))
    ))

    // keyboard content
    .add(dom('aside[route="steps/keyboard"]', () => [
        h('h2', 'Keyboard Shortcuts'),
        h('p', `Adding keyboard behavior to web applications is rewarding, not just for users with disabilities but also for power users who don't want to use the mouse.`),
        h('p', `Here are the full behaviors we're going to add:`),
        h('ul', [
            h('li', 'Autofocus the textbox.'),
            h('li', 'Typing [enter] in the textbox should add the item.'),
            h('li', 'Focus the textbox on [alt + n] (or equivalent).'),
            h('li', 'Tab should enter and exit a list but not navigate a list.'),
            h('li', 'Use arrow keys to navigate the list (up, down, left, right, home, end, pgup, pgdown).'),
            h('li', 'Typing [del] when an item is focused should delete it.'),
            h('li', 'Focus the next logical list item when focused item is deleted.')
        ])
    ]
        .concat(getDownloadDOM('keyboard'))
        .concat([
            h('p.hide', `Try navigating using the keyboard now. Much nicer!`)
        ])
        .concat(getContinueDOM('keyboard', 'toggle'))
    ))

    // toggle content
    .add(dom('aside[route="steps/toggle"]', () => [
        h('h2', 'Toggling Items'),
        h('p', `Maybe we don't want to remove items we've completed. Instead, maybe we just want to mark them as done.`),
        h('p', `For this kind of feature, we're going to need a few things:`),
        h('ul', [
            h('li', 'a checkbox added to each list item'),
            h('li', 'a checkbox click handler to dispatch an action'),
            h('li', 'an equivalent keyboard handler (on spacebar pressed)'),
            h('li', 'some CSS styling for when the item is marked done')
        ])
    ]
        .concat(getDownloadDOM('toggle'))
        .concat([
            h('p.hide', `Go ahead and mark a few items as done. Feels like we're accomplishing something!`)
        ])
        .concat(getContinueDOM('toggle', 'routing'))
    ))

    // routing content
    .add(dom('aside[route="steps/routing"]', () => [
        h('h2', 'Routing'),
        h('h3', 'Editing item details.'),
        h('p', `We've already added the ability to toggle an item's "done" status. But what if there's more data we want to associate with each item?`),
        h('p', `In a situation like this, a master-detail view, implemented using routing, is a good solution.`),
        h('p', `To prepare for this new "edit mode" detail view, let's add routing to our existing scaffold.`),
    ]
        .concat(getDownloadDOM('routing'))
        .concat([
            h('p.hide', `There are 2 features we just added in the downloaded script that you should examine closely.`),
            h('p.hide', `The first is implementing the "navigate" action when a list item is clicked (or the [enter] key is pressed).`),
            h('p.hide', `The second is making sure the currently active item is marked "selected" when loading the page to an existing route.`),
            h('p.hide', ['You can try this out for yourself. Click on an item, refresh this page, and then ', h('em', 'click the download button again.'), 'The previously selected item should automatically activate.'])
        ])
        .concat(getContinueDOM('routing', 'edit-scaffold'))
    ))

    // edit-scaffold content
    .add(dom('aside[route="steps/edit-scaffold"]', () => [
        h('h2', 'Edit Form'),
        h('p', `Just like we scaffolded the main application, we should also scaffold an edit form.`),
        h('p', `Our scaffold will simply have the basic form information and some styles that will be used later.`)
    ]
        .concat(getDownloadDOM('edit-scaffold'))
        .concat([
            h('p.note.hide', `Again, styles that won't change dynamically are best applied using a CSS stylesheet. We only do it here to show what's possible.`)
        ])
        .concat(getContinueDOM('edit-scaffold', 'edit-form'))
    ))

    // edit-form content
    .add(dom('aside[route="steps/edit-form"]', () => [
        h('h2', 'Edit Form Contents'),
        h('p', `Now that we have a scaffold, let's hang some form elements off it.`)
    ]
        .concat(getDownloadDOM('edit-form'))
        .concat([
            h('p.hide', `One additional nice feature we added is to autofocus the "text" field when a new item is activated.`),
            h('p.hide', `Of course, it would be nice if our changes were saved...`)
        ])
        .concat(getContinueDOM('edit-form', 'save'))
    ))

    // save content
    .add(dom('aside[route="steps/save"]', () => [
        h('h2', 'Saving Form Changes'),
        h('p', `At this point, you can probably guess what's coming next.`),
        h('p', `First, we're going to add a Save button to the form. Then, we're going to add a click handler to dispatch an "update" action that will bubble up to our Redux store.`)
    ]
        .concat(getDownloadDOM('save'))
        .concat([
            h('p.hide', `Try making some changes and clicking save. Your edits will now persist back to the Redux store.`)
        ])
        .concat(getContinueDOM('save', 'end'))
    ))

    // end content
    .add(dom('aside[route="steps/end"]', () => [
        h('h2', 'All Finished'),
        h('h3', 'That\'s a nice app!'),
        h('p', `Now you've seen how an application is created, feature-by-feature, in AmaraJS.`),
        h('p', `Hopefully, you agree when we say that feature-based development is the next "big thing".`),
        h('p', `Now, take what you've learned and have fun building your own AmaraJS applications!`),
        h('a.pure-button', {onclick: () => { localStorage.removeItem('amara-todos') }, attributes: {href: '/'}}, 'Start Over')
    ]))

    .bootstrap(document.querySelector('aside'));