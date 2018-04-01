(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.AmaraRedux = factory());
}(this, (function () {

//      

function getAction(type, payload, meta) {
    if ( payload === void 0 ) payload = {};
    if ( meta === void 0 ) meta = {};

    return {type: type, payload: payload, meta: meta};
}

              
                       
                       
                                       
 

               
                        
              
                 
                
 

                                         

                                                                   

function AmaraPluginRedux(store       )             {

    var currentState = store.getState();

    function provideStateArg() {
        return currentState;
    }

    return function createHandler(dispatch) {

        function onReduxStateChanged() {
            var newState = store.getState();
            if (newState !== currentState) {
                currentState = newState;
                dispatch(getAction('core:change-occurred', 'state'));
            }
        }

        store.subscribe(onReduxStateChanged);

        return function handler(action        ) {
            if (action.type === 'core:bootstrap') {
                action.payload.register('state', provideStateArg);
            }
            Object.defineProperty(action, '__Amara__', {
                configurable: false,
                enumerable: false,
                writable: false,
                value: true
            });
            store.dispatch(action);
        };

    };

}

return AmaraPluginRedux;

})));
//# sourceMappingURL=amara-plugin-redux.umd.js.map
