(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.AmaraBrowser = factory());
}(this, (function () {

//      

function action(type, payload) {
    return { type: type, payload: payload };
}

function without(lhs          , rhs           ) {
    if (!rhs) { return lhs; }
    var difference = new Set(lhs);
    rhs.forEach(difference.delete, difference);
    return difference;
}

function setHas(node) {
    this.result = this.result && this.set.has(node);
}

function equals(lhs          , rhs          )          {
    var context = {result: true, set: rhs};
    lhs.forEach(setHas, context);
    return context.result && rhs.size === lhs.size;
}

function addOrUpdate(key) {
    var ref = this;
    var map = ref.map;
    var value = ref.value;
    var set = map.get(key) || new Set();
    set.add(value);
    map.set(key, set);
}

function overwriteWith(targets          , feature         ) {
    targets.forEach(addOrUpdate, { map: this, value: feature });
}

function overwrite(lhs                         , rhs                         ) {
    lhs.clear();
    rhs.forEach(overwriteWith, lhs);
}

function AmaraPluginEngineBrowser()               {

    return function createHandler(dispatch) {

        var root         ,
            observer                  ,
            featureTargets                          = new Map(),
            targetFeatures                          = new Map();

        var features               = new Set();
        var attributes              = new Set(['class']);
        var rxAttribute = /\[([^=\]]+?)[~^$|*=\]]/;

        function gatherAttributes(feature) {
            var attr,
                attrs,
                attrIndex,
                target,
                targets = feature.targets,
                targetIndex = targets.length;
            while (target = targets[--targetIndex]) {
                attrs = target.match(rxAttribute);
                if (!attrs) { continue; }
                attrs = attrs.slice(1);
                attrIndex = attrs.length;
                while (attr = attrs[--attrIndex]) {
                    attributes.add(attr);
                }
            }
        }

        function updateWatchedAttributes(subset              ) {
            var before = attributes.size;
            subset.forEach(gatherAttributes);
            var after = attributes.size;
            (after !== before) && observeDOMChanges();
        }

        function removeTargetsFromFeatures(nodes           , feature         ) {
            featureTargets.set(feature, without(nodes, this));
        }

        function handleRemovedTargets(removed           ) {
            if (!removed.size) { return; }
            removed.forEach(targetFeatures.delete, targetFeatures);
            featureTargets.forEach(removeTargetsFromFeatures, removed);
            dispatch(action('engine:targets-removed', Array.from(removed)));
        }

        function populateFeatureTargets(feature) {
            var selector = feature.targets.join(', ');
            var targets = new Set(root.querySelectorAll(selector));
            if (root.matches(selector)) { targets.add(root); }
            featureTargets.set(feature, targets);
        }

        function dispatchEmptyApplyResult(target) {
            var map = {};
            map[this.type] = new Map([[target, []]]);
            dispatch(action('core:apply-target-results', map));
        }

        function handleNewlyEmptyFeatures(targets, feature) {
            var currTargets = featureTargets.get(feature);
            var old = without(targets, currTargets);
            old.size && dispatch(action('core:clear-cache', {feature: feature, targets: old}));
            old.forEach(dispatchEmptyApplyResult, feature);
        }

        function populateApplyQueue(targets, feature) {
            var ref = this;
            var prevTargets = ref.prevTargets;
            var featuresToApply = ref.featuresToApply;
            var previous = prevTargets.get(feature) || new Set();
            if (targets.size && !equals(targets, previous)) {
                featuresToApply.set(feature, targets);
            }
        }

        function updateFeatureTargets(subset) {
            if ( subset === void 0 ) subset               = features;

            if (!root) { return; }
            var prevTargets = new Map(featureTargets);
            var featuresToApply                          = new Map();
            subset.forEach(populateFeatureTargets);
            prevTargets.forEach(handleNewlyEmptyFeatures);
            featureTargets.forEach(populateApplyQueue, { prevTargets: prevTargets, featuresToApply: featuresToApply });
            overwrite(targetFeatures, featureTargets);
            if (featuresToApply.size) {
                onPopulateFeatureTargets(featuresToApply);
                var queue                                             = [];
                featuresToApply.forEach(function (targets, feature) { return queue.push({feature: feature, targets: Array.from(targets)}); });
                dispatch(action('core:enqueue-apply', queue));
            }
        }

        function onMutationOccurred(mutationRecords) {
            var removed            = new Set();
            var mutationRecord, index = mutationRecords.length;
            while (mutationRecord = mutationRecords[--index]) {
                Array.from(mutationRecord.removedNodes)
                    .filter(targetFeatures.has, targetFeatures)
                    .forEach(removed.add, removed);
            }
            handleRemovedTargets(removed);
            updateFeatureTargets();
        }

        function observeDOMChanges() {
            if (!root) { return; }
            observer && observer.disconnect();
            observer = new window.MutationObserver(onMutationOccurred);
            observer.observe(root, {
                subtree: true,
                childList: true,
                attributes: true,
                attributeFilter: Array.from(attributes)
            });
        }

        function onBootstrap(ref) {
            var target = ref.target;

            root = target;
            dispatch(action('engine:append-observed-attributes', attributes));
            observeDOMChanges();
            updateFeatureTargets();
        }

        function onFeaturesAdded(added              ) {
            added.forEach(features.add, features);
            updateWatchedAttributes(added);
            updateFeatureTargets(added);
        }

        function isSameTypeFeatureWithTargets(feat) {
            var currT = featureTargets.get(feat);
            return feat !== this && feat.type === this.type && currT && currT.size > 0;
        }

        function addFeaturesOfSameType(value      ) {
            var ref = this;
            var feature = ref.feature;
            var map = ref.map;
            Array.from(targetFeatures.get(value) || new Set())
                .filter(isSameTypeFeatureWithTargets, feature)
                .forEach(addOrUpdate, {map: map, value: value});
        }

        function addCurrentTargets(targets           , feature         , featuresToApply) {
            var currTargets                 = featureTargets.get(feature);
            currTargets && currTargets.forEach(targets.add, targets);
            if (targets.size === 0) { return featuresToApply.delete(feature); }
            targets.forEach(addFeaturesOfSameType, {map: featuresToApply, feature: feature});
        }

        function onPopulateFeatureTargets(featuresToApply                         ) {
            // a feature's `args` have changed, so core wants all the DOM nodes that
            // were targeted by that feature. it's going to re-invoke the apply function
            // for each target node and -- if the return value has changed -- pass the
            // results to the plugin middleware to apply. for this reason, we also want
            // core to know about any other features of the same type that targeted the
            // same DOM node
            featuresToApply.forEach(addCurrentTargets);
        }

        return function handle(action                                                                  ) {
            switch (action.type) {
            case 'core:bootstrap':
                onBootstrap(action.payload);
                break;
            case 'core:features-added':
                onFeaturesAdded(action.payload);
                break;
            case 'core:populate-feature-targets':
                onPopulateFeatureTargets(action.payload);
                break;
            }
        };

    };

}

return AmaraPluginEngineBrowser;

})));
//# sourceMappingURL=amara-plugin-engine-browser.umd.js.map
