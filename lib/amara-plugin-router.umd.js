(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.AmaraRouter = factory());
}(this, (function () {

//

//      

var rxInvalidChars = /[\\"'/|]/g;
var rxJSON = /^[\{\["]|^(true|false|null|\d+)$/;
var rxISODate = /^\d{4}-\d{2}-\d{2}T\d\d:\d\d:\d\d\.\d{3}Z$/;

var Types = {
    Nil: '[object Null]',
    Date: '[object Date]',
    Bool: '[object Boolean]',
    Array: '[object Array]',
    Error: '[object Error]',
    Undef: '[object Undefined]',
    Object: '[object Object]',
};

var getType = Object.prototype.toString;





function copy(key        ) {
    var value = this.object[key];
    if (value !== undefined || (!(key in this.result)))
        { this.result[key] = value; }
}

function merge() {
    var objects = [], len = arguments.length;
    while ( len-- ) objects[ len ] = arguments[ len ];

    var object,
        index = 0,
        result = Object.create(null);
    while (object = objects[index++]) {
        Object.keys(object).forEach(copy, {result: result, object: object});
    }
    return result;
}

function zip(keys          , values       ) {
    var zip = Object.create(null);
    var len = keys && keys.length || 0;
    for(var i = 0; keys && (i < len); i++) {
        zip[keys[i]] = values[i];
    }
    return zip;
}

function attempt(fn          , ctx       ) {
    var args = [], len = arguments.length - 2;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 2 ];

    try {
        return fn.apply(ctx, args);
    } catch (e) {
        return e;
    }
}

function decodeValue(value        ) {
    var parsed, val = decodeURIComponent(value);
    if (rxISODate.test(val)) {
        return new Date(val);
    } else if (rxJSON.test(val)) {
        parsed = attempt(JSON.parse, JSON, val);
        if (getType.call(parsed) === Types.Error) {
            return undefined;
        }
        return parsed;
    }
    return val;
}

function slash(str        )         {
    return str.replace(rxInvalidChars, '\\$&');
}

function splitBy(str        ) {
    return str.split(String(this));
}

function substring(str        )         {
    return str.substring(Number(this));
}

//      

var rxPathQS = /([^?]+)\??(.*)/;
var keyExists = function (ref) {
    var key = ref[0];

    return key;
};

function encodeValue(key) {
    var ref = this;
    var params = ref.params;
    var parts = ref.parts;
    var val = params[key];
    var pre = encodeURIComponent(key) + '=';
    switch (getType.call(val)) {
        case Types.Nil:
        case Types.Undef:
            return;
        case Types.Bool:
            val && parts.push(encodeURIComponent(key));
            break;
        case Types.Array:
        case Types.Object:
            return parts.push(pre + encodeURIComponent(JSON.stringify(val)));
        case Types.Date:
            return parts.push(pre + val.toISOString());
        default:
            return parts.push(pre + encodeURIComponent(val));
    }
}

function encodeQueryString(params)         {
    if ( params === void 0 ) params    = {};

    var context = {params: params, parts: []};
    Object.keys(params)
        .sort()
        .forEach(encodeValue, context);
    return context.parts.length && '?' + context.parts.join('&') || '';
}

function createParamsMap(out, ref) {
    var key = ref[0];
    var value = ref[1]; if ( value === void 0 ) value = 'true';

    return out[key] = decodeValue(value), out;
}

function createHashMethods(hashDelimiters                          , rxSelectorUrl        ) {

    function getHashPart(path        )                     {
        var ref = (path.match(rxSelectorUrl) || []).slice(1);
        var target = ref[0];
        var url = ref[1]; if ( url === void 0 ) url = '';
        var ref$1 = (url.match(rxPathQS) || []).slice(1);
        var route = ref$1[0];
        var QS = ref$1[1]; if ( QS === void 0 ) QS = '';
        var params = QS.split('&')
            .map(splitBy, '=')
            .filter(keyExists)
            .reduce(createParamsMap, {});
        return {target: target, route: route, params: params};
    }

    function getHashData(hash        )                     {
        return hash
            .replace(hashDelimiters.hashPrefix, '')
            .split(hashDelimiters.selectorBetween)
            .filter(Boolean)
            .map(getHashPart);
    }

    function encodeHashPart(ref                    )         {
        var target = ref.target;
        var route = ref.route;
        var params = ref.params; if ( params === void 0 ) params = {};

        var qs = encodeQueryString(params);
        return ("" + target + (hashDelimiters.selectorWithin) + route + qs);
    }

    function getHashString(data                    )         {
        return hashDelimiters.hashPrefix + data
            .map(encodeHashPart)
            .join(hashDelimiters.selectorBetween);
    }

    return {
        getHashData: getHashData,
        getHashString: getHashString
    };

}

//      

var tokenPrefixLength = 2;
var rxToken = /\/:([^\/]+)/g;

var DEFAULT_HASH_PARTS                           = Object.freeze({
    hashPrefix: '#!',
    selectorWithin: '://',
    selectorBetween: '||'
});

function AmaraPluginRouter(hashDelimiters) {
    if ( hashDelimiters === void 0 ) hashDelimiters                           = DEFAULT_HASH_PARTS;


    var rxSelectorUrl = new RegExp(("(.+?)" + (slash(hashDelimiters.selectorWithin)) + "(.+)"));
    var rxValidHash = new RegExp([
        '^', slash(hashDelimiters.hashPrefix),
        '(.+?', slash(hashDelimiters.selectorWithin), '[^?]+?\\??\\S+?(',
        slash(hashDelimiters.selectorBetween), '|$))+'
    ].join(''));

    var ref = createHashMethods(hashDelimiters, rxSelectorUrl);
    var getHashData = ref.getHashData;
    var getHashString = ref.getHashString;

    return function createHandler(dispatch          ) {

        var lastHash              = null;

        var targetRoutes                                          = new Map();
        var targetParams                                         = new Map();

        function getAncestorRouteParams(target         )                             {
            var result = [];
            var params,
                current = target && target.parentElement;
            while (current) {
                params = targetParams.get(current);
                if (params) { result.unshift(params); }
                current = current.parentElement;
            }
            return result;
        }

        function getRouteParams(target         )                           {
            var ancestorParams = getAncestorRouteParams(target);
            var params = targetParams.get(target) || {};
            return Object.freeze(merge.apply(void 0, ancestorParams.concat( [params] )));
        }

        function removeRouteAttribute(_, el) {
            el.removeAttribute('route');
        }

        function clearInvalidHash(hash        ) {
            if (rxValidHash.test(hash) || (!hash && !lastHash)) {
                return;
            }
            var document = window.document;
            var history = window.history;
            var location = window.location;
            targetParams.clear();
            targetRoutes.forEach(removeRouteAttribute);
            return history.replaceState(
                null,
                document.title,
                location.pathname + location.search
            );
        }

        function setRouteOnTarget(targetRoute) {
            var ref = this;
            var el = ref.el;
            var route = ref.route;
            var params = ref.params;
            var routeData = ref.routeData;
            var rxRoute = new RegExp(targetRoute.replace(rxToken, '/([^/]+)'));
            if (!routeData.active && rxRoute.test(route)) {
                var values = (route.match(rxRoute) || [])
                    .slice(1)
                    .map(decodeValue);
                var tokens = (targetRoute.match(rxToken) || [])
                    .map(substring, tokenPrefixLength);
                routeData.active = true;
                targetParams.set(el, merge(params, zip(tokens, values)));
                if (el.getAttribute('route') !== route)
                    { el.setAttribute('route', route); }
            }
        }

        function updateMatchingTarget(ref) {
            var target = ref.target;
            var route = ref.route;
            var params = ref.params; if ( params === void 0 ) params = {};

            var ref$1 = this;
            var el = ref$1.el;
            var routeData = ref$1.routeData;
            if (!el.matches(target)) { return; }
            routeData.routes.forEach(setRouteOnTarget, {el: el, route: route, params: params, routeData: routeData});
        }

        function applyMatchingRoutes(routeData                           , el         ) {
            routeData.active = false;
            this.forEach(updateMatchingTarget, {el: el, routeData: routeData});
        }

        function resetTarget(target) {
            targetParams.delete(target);
            target.removeAttribute('route');
        }

        function resetInactiveRoute(routeData                           , target         ) {
            !routeData.active && resetTarget(target);
        }

        function resetDisconnectedTarget(_, target      ) {
            if (this.includes(target)) {
                var el      = target;
                targetParams.delete(el);
                targetRoutes.delete(el);
            }
        }

        function resetDisconnectedTargets(targets        ) {
            targetRoutes.forEach(resetDisconnectedTarget, targets);
        }

        function updateMatchingTargets(hash) {
            if (!rxValidHash.test(hash)) { return; }
            var hashData = getHashData(hash);
            targetRoutes.forEach(applyMatchingRoutes, hashData);
            targetRoutes.forEach(resetInactiveRoute);
        }

        function announceChangeOccurred(hash) {
            lastHash !== hash && dispatch({
                type: 'core:change-occurred',
                payload: 'routeParams'
            });
        }

        function onHashChanged() {
            var hash = window.document.location.hash;
            clearInvalidHash(hash);
            updateMatchingTargets(hash);
            announceChangeOccurred(hash);
            lastHash = hash;
        }

        function updateTargetRoute(arr                     , target         ) {
            var routes           = (ref = []).concat.apply(ref, arr);
            if (routes.length) {
                targetRoutes.set(target, {routes: routes, active: false});
            } else {
                resetTarget(target);
                targetRoutes.delete(target);
            }
            var ref;
        }

        function updateTargetRoutes(data                          ) {
            data.forEach(updateTargetRoute);
            onHashChanged();
        }

        function byTarget(ref) {
            var target = ref.target;

            return target === String(this);
        }

        function navigate(payload                    ) {
            var target = payload.target;
            var hashData = getHashData(window.document.location.hash);
            var index = hashData.findIndex(byTarget, target);
            index >= 0 && hashData.splice(index, 1, payload) || hashData.push(payload);
            window.document.location.hash = getHashString(hashData);
        }

        window.addEventListener('hashchange', onHashChanged);

        return function handler(action                         ) {
            switch (action.type) {
            case 'core:bootstrap':
                action.payload.register('routeParams', getRouteParams);
                break;
            case 'core:apply-target-results':
                action.payload.route && updateTargetRoutes(action.payload.route);
                break;
            case 'engine:append-observed-attributes':
                action.payload.add('route');
                break;
            case 'engine:targets-removed':
                resetDisconnectedTargets(action.payload);
                break;
            case 'router:navigate':
                navigate(action.payload);
                break;
            }
        };

    };

}

return AmaraPluginRouter;

})));
//# sourceMappingURL=amara-plugin-router.umd.js.map
