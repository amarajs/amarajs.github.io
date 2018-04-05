const h = virtualDom.h;

const factory = type => (targets, args, apply) => ({
    type,
    args: apply == null ? null : args,
    apply: apply == null ? args : apply,
    targets: Array.isArray(targets) ? targets : [targets]
});

const dom = factory('dom');
const events = factory('events');
const style = factory('style');
const css = factory('class');
const routes = factory('route');