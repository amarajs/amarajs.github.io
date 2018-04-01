(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.Amara = factory());
}(this, (function () {

//

//      

function addToDispatchArg(provider, arg) {
    this[arg] = provider(this.target);
}

function applyArgReducer(data   
             
                         
                           
                    
 , key) {
    var prevArgs = data.info.lastArgs;
    var selector = data.feature.args[key];
    var result = selector(data.args);
    data.changed = data.changed ||
        (!(key in prevArgs)) ||
        (result !== prevArgs[key]);
    prevArgs[key] = result;
    return data;
}

function Connection(ref   
                                                 
                                                         
                                                               
 ) {
    var keyFeatures = ref.keyFeatures;
    var argProviders = ref.argProviders;
    var featureConnections = ref.featureConnections;


    var meta                                                   = new Map();

    function logAccess(feature, prop) {
        var set = keyFeatures.get(prop);
        set && set.add(feature) || keyFeatures.set(prop, new Set([feature]));
    }

    function createPropertyDescriptor(data, key) {
        data.result[key] = {
            get: function get() {
                logAccess(data.feature, key);
                return data.obj[key];
            }
        };
        return data;
    }

    function getLoggerWrapper(feature, obj) {
        var data = {
            obj: obj,
            feature: feature,
            result: {}
        };
        return Object.create(null, Object.keys(obj)
            .reduce(createPropertyDescriptor, data).result);
    }

    function invoke(target) {

        var args = {target: target};

        var feature                = this;
        var map = meta.get(feature) || new WeakMap();

        var info = map.get(target) || {
            logged: false,
            value: undefined,
            lastArgs: {}
        };

        argProviders.forEach(addToDispatchArg, args);
        args = info.logged ? args : getLoggerWrapper(feature, args);

        var callData = { info: info, feature: feature, args: args, changed: false };
        Object.keys(feature.args).reduce(applyArgReducer, callData);

        if (!map.has(target) || callData.changed) {
            var params = Object.assign({}, info.lastArgs);
            info.value = feature.apply(params);
            info.logged = true;
            callData.changed = true;
        }

        map.set(target, info);
        meta.set(feature, map);

        return {changed: callData.changed, value: info.value};

    }

    return function createFeatureConnection(feature               ) {
        var invoker = invoke.bind(feature);
        invoker.clearCache = function (targets          ) {
            var map = meta.get(feature);
            map && targets.forEach(map.delete, map);
        };
        featureConnections.set(feature, invoker);
    };

}

var resolved = Promise.resolve();

function immediate(fn) {
    resolved.then(fn);
}



function attempt(fn) {
    var args = [], len = arguments.length - 1;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

    try {
        return fn.apply(void 0, args)
    } catch (e) {
        return e;
    }
}





function throwError(message) {
    throw new Error(message);
}

function getAction(type, payload, meta) {
    if ( payload === void 0 ) payload = {};
    if ( meta === void 0 ) meta = {};

    return {type: type, payload: payload, meta: meta};
}

function overEvery() {
    var fns = [], len = arguments.length;
    while ( len-- ) fns[ len ] = arguments[ len ];

    return function iterator(item) {
        var fn, index = fns.length;
        while (fn = fns[--index]) {
            fn(item);
        }
    };
}

function debounce(method, scheduler) {
    if ( scheduler === void 0 ) scheduler = immediate;

    var called = false;
    return function scheduled() {
        var args = [], len = arguments.length;
        while ( len-- ) args[ len ] = arguments[ len ];

        if (called) {
            return;
        }
        called = true;
        scheduler(function () {
            called = false;
            method.apply(void 0, args);
        });
    };
}

//      

var featureCount = 0; // ensures unique feature ids

// helpers

function createEmptySetForKey(key) {
    this.set(key, new Set());
}

function isAlsoTrue(predicate) {
    this.result = this.result && predicate(this.arg);
}

function every(predicates                   , arg               )          {
    var context = {result: true, arg: arg};
    predicates.forEach(isAlsoTrue, context);
    return context.result;
}

function isNonEmptyString(obj) {
    return !!obj && typeof obj === 'string' && obj.trim().length > 0;
}

function validate(feature) {
    if (!feature || !('type' in feature) || !('targets' in feature) || !('apply' in feature)) {
        throwError('Features require "type", "targets", and "apply" members.');
    } else if (typeof feature.apply !== 'function') {
        throwError('Member "apply" must be a function.');
    } else if (!isNonEmptyString(feature.type)) {
        throwError('Member "type" must be a non-empty string.');
    } else if (!Array.isArray(feature.targets) || !feature.targets.length || !feature.targets.every(isNonEmptyString)) {
        throwError('Member "targets" must be a non-empty array of non-empty strings.');
    }
}

function validateConfig(key, callback) {
    if (!isNonEmptyString(key) || typeof callback !== 'function') {
        throwError('Method `config` expects a non-empty string and a function.');
    }
}

function copy(key) {
    this.result.set(key, this.map.get(key));
}

function sort(sorter              ) {
    if (this.result !== 0) { return; }
    this.result = sorter(this.a, this.b);
}

function addToMap(target) {
    var arr = this.map.get(target);
    var result = this.invoke(target);
    if (!arr) {
        this.map.set(target, [result]);
    } else {
        arr[arr.length] = result;
    }
}

function Amara(middleware)              {
    if ( middleware === void 0 ) middleware                     = [];


    var bootstrapped = false;

    // the collection of arg keys that have been changed this frame
    var changedKeys              = new Set();

    // the features added to amara in this frame
    var addedFeatures                     = new Set();

    // all the features added to amara with connected apply methods
    var features                       = [];

    // any configured filter and sorter utility methods
    var helpers                             = new Map();

    // the features which need to be re-applied
    var applyQueue                               = new Map();

    // arg keys and their corresponding selector function
    var argProviders                                         = new Map();

    // the instantiated middleware pipeline
    var interceptors = [handler].concat(middleware.map(createInterceptor));

    // keeps track of which features accessed each arg key
    var keyFeatures                                  = new Map();

    var featureConnections                                          = new Map();
    var createFeatureConnection = Connection({featureConnections: featureConnections, argProviders: argProviders, keyFeatures: keyFeatures});
    var addAndConnectFeature = overEvery(Array.prototype.push.bind(features), createFeatureConnection);

    function dispatch(action) {
        var result,
            interceptor,
            index = interceptors.length;
        while (interceptor = interceptors[--index]) {
            result = attempt(interceptor, action);
            if (result instanceof Error) {
                dispatch(getAction('error', result));
                break;
            }
        }
    }

    function createInterceptor(mw                  )                      {
        return mw(dispatch);
    }

    function register(key, paramProvider) {
        argProviders.set(key, paramProvider);
        return function () { return argProviders.delete(key); };
    }

    function setDefaults(feature) {
        feature.id = featureCount++;
        feature.args = feature.args || {};
    }

    function processFeatureTargets(targets, feature) {
        targets && targets.size && enqueueApply(feature, targets);
    }

    function addFeatureToMap(key) {
        var set = keyFeatures.get(key);
        set && set.forEach(createEmptySetForKey, this);
    }

    function onChangeOccurred(key        ) {
        if (!argProviders.has(key)) {
            throwError(("No value provider has been specified for '" + key + "'."));
        }
        changedKeys.add(key);
        scheduleKeyChangeHandler();
    }

    function onFeaturesAdded(added                    ) {
        added.forEach(addAndConnectFeature);
    }

    function onEnqueueApply(items                                                 ) {
        var item, index = 0;
        while (item = items[index++]) {
            enqueueApply(item.feature, item.targets);
        }
    }

    function onClearFeatureTargetsCache(ref   
                          
                              
     ) {
        var feature = ref.feature;
        var targets = ref.targets;

        var connection = featureConnections.get(feature);
        connection && connection.clearCache(targets);
    }

    function handler(action) {
        var payload      = action.payload;
        switch (action.type) {
        case 'core:change-occurred':
            onChangeOccurred(payload);
            break;
        case 'core:features-added':
            onFeaturesAdded(payload);
            break;
        case 'core:enqueue-apply':
            onEnqueueApply(payload);
            break;
        case 'core:clear-cache':
            onClearFeatureTargetsCache(payload);
        }
    }

    function isAllowed(feature) {
        var filters                         = helpers.get('filter');
        return !filters || every(filters, feature);
    }

    function enqueueApply(feature, targets) {
        if (!isAllowed(feature)) { return; }
        var targetSet = applyQueue.get(feature);
        if (!targetSet) {
            applyQueue.set(feature, new Set(targets));
        } else {
            targets.forEach(targetSet.add, targetSet);
        }
        scheduleQueueFlush();
    }

    function invokeConnection(targets, feature) {
        var invoke = featureConnections.get(feature);
        var map = this[feature.type] = this[feature.type] || new Map();
        targets.forEach(addToMap, {map: map, invoke: invoke, type: feature.type});
    }

    function masterSort(a               , b               )         {
        var context = {result: 0, a: a, b: b};
        var sorters                         = helpers.get('sorter');
        if (!sorters)
            { return 0; }
        sorters.forEach(sort, context);
        return context.result;
    }

    function byId(a               , b               )         {
        return a.id - b.id;
    }

    function sortByKeys(map                              ) {
        var keys = Array.from(map.keys());
        var context = {
            map: map,
            result: new Map()
        };
        keys.sort(byId);
        keys.sort(masterSort);
        keys.forEach(copy, context);
        return context.result;
    }

    function isChanged(result) {
        return result.changed;
    }

    function getValue(result) {
        return result.value;
    }

    function mapOrRemoveUnchanged(results, target) {
        if (!results.some(isChanged)) {
            return this.delete(target);
        }
        this.set(target, results.map(getValue));
    }

    function prune(type) {
        var targetResults = this[type];
        targetResults.forEach(mapOrRemoveUnchanged, targetResults);
        targetResults.size || delete this[type];
    }

    function removeUnchangedResults(payload                                  ) {
        Object.keys(payload).forEach(prune, payload);
    }

    var scheduleKeyChangeHandler = debounce(function keyChangeHandler() {
        var map                               = new Map();
        changedKeys.forEach(addFeatureToMap, map);
        dispatch(getAction('core:populate-feature-targets', map));
        sortByKeys(map).forEach(processFeatureTargets);
        changedKeys.clear();
    }, setTimeout);

    var scheduleQueueFlush = debounce(function flushApplyQueue() {
        var payload                                  = {};
        sortByKeys(applyQueue).forEach(invokeConnection, payload);
        removeUnchangedResults(payload);
        applyQueue.clear();
        Object.keys(payload).length && dispatch(getAction('core:apply-target-results', payload));
    });

    var scheduleBootstrap = debounce(function announceBootstrap(payload) {
        dispatch(getAction('core:bootstrap', payload));
    });

    var scheduleFeaturesAdded = debounce(function announceAddedFeatures() {
        var added                     = new Set(addedFeatures);
        addedFeatures.clear();
        dispatch(getAction('core:features-added', added));
    });

    var api = {

        bootstrap: function bootstrap(target) {
            bootstrapped && throwError('Amara already bootstrapped.');
            bootstrapped = true;
            scheduleBootstrap({target: target, register: register});
            return api;
        },

        add: function add(feature) {
            if (!features.includes(feature)) {
                validate(feature);
                setDefaults(feature);
                addedFeatures.add(feature);
                scheduleFeaturesAdded();
            }
            return api;
        },

        config: function config(key, method) {
            validateConfig(key, method);
            var set = helpers.get(key);
            set && set.add(method) || helpers.set(key, new Set([method]));
            return api;
        }

    };

    return api;

}

return Amara;

})));
//# sourceMappingURL=amara-core.umd.js.map
