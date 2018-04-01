(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.AmaraEvents = factory());
}(this, (function () {

//      

var rxEventAndSelectors = /(^[^\s]+)\s*?(.*?)$/;

var metaEventMap = {
    keydown:    'key',
    keyup:      'key',
    keypress:   'key',
    mousedown:  'button',
    mouseup:    'button'
};

var trim = function (s) { return s.trim(); };
var trimLower = function (s) { return s.trim().toLowerCase(); };

function matches(selector) {
    return this.matches(selector);
}

function asMeta(value) {
    switch (value) {
        case 'space':   return ' ';
        case 'left':    return '0';
        case 'middle':  return '1';
        case 'wheel':   return '1';
        case 'right':   return '2';
        default:        return value;
    }
}

// browser cross-compatibility
function fixMeta(value) {
    switch (value) {
        case 'del':     return 'delete';
        default:        return value;
    }
}

function removeListener(handler) {
    this.target.removeEventListener(this.type, handler);
}

function removeListeners(handlers, type) {
    handlers.forEach(removeListener, {target: this, type: type});
}

function throwError(message) {
    throw new Error(message);
}

function AmaraPluginEvents()              {

    return function createHandler(dispatch          ) {

        var root = null,
            async = true;

        var targetHandlers                            = new WeakMap();

        function proxyToAmara(e) {
            !e.type.startsWith('amara:') && dispatch(e.detail);
        }

        function syncDispatch(dispatcher, action) {
            async = false;
            dispatcher(action, {});
            async = true;
        }

        // firefox and IE don't dispatch events from disabled
        // form elements; we temporarily remove the element's
        // disabled attribute but watch for changes so we can
        // set the attribute correctly when the event completes

        function prePatchDisabledBug(target, meta) {
            meta.orig = {
                setAttribute: target.setAttribute,
                removeAttribute: target.removeAttribute
            };
            meta.disabled = target.hasAttribute('disabled');
            target.removeAttribute('disabled');
            target.setAttribute = function (attr, value) {
                if (attr !== 'disabled') {
                    return meta.orig.setAttribute.call(target, attr, value);
                }
                meta.disabled = true;
            };
            target.removeAttribute = function (attr) {
                if (attr !== 'disabled') {
                    return meta.orig.removeAttribute.call(target, attr);
                }
                meta.disabled = false;
            };
        }

        function postPatchDisabledBug(target, meta) {
            target.setAttribute = meta.orig.setAttribute;
            target.removeAttribute = meta.orig.removeAttribute;
            meta.disabled ? target.setAttribute('disabled', '') : target.removeAttribute('disabled');
        }

        function getTargetDispatcher(target) {
            return function dispatchActionAsEvent(action        , eventInitOptions) {
                if ( eventInitOptions === void 0 ) eventInitOptions = {
                bubbles: true,
                cancelable: true,
                composed: true
            };

                if (async) { throwError('Event actions must be dispatched synchronously.'); }
                eventInitOptions.detail = action;
                var meta = {};
                var ce = new window.CustomEvent(action.type, eventInitOptions);
                root && root.addEventListener(action.type, proxyToAmara);
                prePatchDisabledBug(target, meta);
                var result = target.dispatchEvent(ce);
                postPatchDisabledBug(target, meta);
                root && root.removeEventListener(action.type, proxyToAmara);
                return result;
            };
        }

        function addHandlerForEvent(eventAndSelectors) {
            var arrHandlers                ,
                mapEventHandlers;
            var ref = this;
            var map = ref.map;
            var target = ref.target;
            var dispatcher = ref.dispatcher;
            var ref$1 =
                (rxEventAndSelectors.exec(eventAndSelectors) || []).slice(1);
            var eventMeta = ref$1[0];
            var selectors = ref$1[1]; if ( selectors === void 0 ) selectors = '';
            var handler               = map[eventAndSelectors];
            var delegates           = selectors
                .split(',')
                .map(trim)
                .filter(Boolean);
            var ref$2 = eventMeta
                .split('.')
                .map(trimLower)
                .map(asMeta);
            var event = ref$2[0];
            var meta = ref$2.slice(1);
            function eventHandler(e       ) {
                var result, metaValue = fixMeta(String(e[metaEventMap[e.type]]).toLowerCase());
                if (delegates.length && !delegates.some(matches, e.target)) {
                    return;
                }
                if (meta.length && !meta.includes(String(metaValue).toLowerCase())) {
                    return;
                }
                async = false;
                e.dispatch = dispatcher;
                result = handler.call(this, e);
                async = true;
                return result;
            }
            if (event.startsWith('amara:') && delegates.length) {
                throwError('amara:* events must not be delegated');
            }
            mapEventHandlers = targetHandlers.get(target);
            if (!mapEventHandlers) {
                this.added = true;
                targetHandlers.set(target, mapEventHandlers = new Map());
            }
            arrHandlers = mapEventHandlers.get(event);
            arrHandlers || mapEventHandlers.set(event, arrHandlers = []);
            target.addEventListener(event, eventHandler);
            arrHandlers.push(eventHandler);
        }

        function applyEventMap(map          ) {
            this.map = map;
            Object.keys(map).forEach(addHandlerForEvent, this);
        }

        function applyEventsToTarget(results            , target      ) {
            var context = {
                target: target,
                added: false,
                dispatcher: getTargetDispatcher(target)
            };
            var mapEventHandlers = targetHandlers.get(target);
            mapEventHandlers && mapEventHandlers.forEach(removeListeners, target);
            mapEventHandlers && mapEventHandlers.clear();
            (ref = []).concat.apply(ref, results).forEach(applyEventMap, context);
            context.added && syncDispatch(context.dispatcher, {type: 'amara:add'});
            syncDispatch(context.dispatcher, {type: 'amara:apply'});
            var ref;
        }

        function removeTargetHandlers(target      ) {
            var mapHandlerWrapper                                   = targetHandlers.get(target);
            if (mapHandlerWrapper) {
                syncDispatch(getTargetDispatcher(target), {type: 'amara:remove'});
                targetHandlers.delete(target);
                mapHandlerWrapper.forEach(removeListeners, target);
                mapHandlerWrapper.clear();
            }
        }

        return function handler(action) {
            switch(action.type) {
            case 'core:bootstrap':
                root = action.payload.target;
                break;
            case 'core:apply-target-results':
                action.payload.events && action.payload.events.forEach(applyEventsToTarget);
                break;
            case 'engine:targets-removed':
                action.payload.forEach(removeTargetHandlers);
            }
        };

    };

}

return AmaraPluginEvents;

})));
//# sourceMappingURL=amara-plugin-events.umd.js.map
