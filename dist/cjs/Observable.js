'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _Observer = require('./Observer');

var _Observer2 = _interopRequireDefault(_Observer);

var _Subscription = require('./Subscription');

var _Subscription2 = _interopRequireDefault(_Subscription);

var _utilSymbol_observer = require('./util/Symbol_observer');

var _utilSymbol_observer2 = _interopRequireDefault(_utilSymbol_observer);

var _ObserverFactory = require('./ObserverFactory');

var _ObserverFactory2 = _interopRequireDefault(_ObserverFactory);

var Observable = (function () {
    function Observable() {
        var subscriber = arguments[0] === undefined ? null : arguments[0];

        _classCallCheck(this, Observable);

        this.source = null;
        this.observerFactory = new _ObserverFactory2['default']();
        if (subscriber) {
            this.subscriber = subscriber;
        }
    }

    Observable.create = function create(subscriber) {
        return new Observable(subscriber);
    };

    Observable.prototype.subscriber = function subscriber(observer) {
        return this.source.subscribe(this.observerFactory.create(observer));
    };

    Observable.prototype.lift = function lift(observerFactory) {
        var observable = new Observable();
        observable.source = this;
        observable.observerFactory = observerFactory;
        return observable;
    };

    Observable.prototype[_utilSymbol_observer2['default']] = function (observer) {
        if (!(observer instanceof _Observer2['default'])) {
            observer = new _Observer2['default'](observer);
        }
        return _Subscription2['default'].from(this.subscriber(observer), observer);
    };

    Observable.prototype.subscribe = function subscribe(observerOrNext) {
        var error = arguments[1] === undefined ? null : arguments[1];
        var complete = arguments[2] === undefined ? null : arguments[2];

        var observer = undefined;
        if (typeof observerOrNext === 'object') {
            observer = observerOrNext;
        } else {
            observer = _Observer2['default'].create(observerOrNext, error, complete);
        }
        return this[_utilSymbol_observer2['default']](observer);
    };

    Observable.prototype.forEach = function forEach(nextHandler) {
        var _this = this;

        return new Promise(function (resolve, reject) {
            var observer = _Observer2['default'].create(function (value) {
                nextHandler(value);
                return { done: false };
            }, function (err) {
                reject(err);
                return { done: true };
            }, function (value) {
                resolve(value);
                return { done: true };
            });
            _this[_utilSymbol_observer2['default']](observer);
        });
    };

    return Observable;
})();

exports['default'] = Observable;

function dispatchSubscription(_ref) {
    var observer = _ref[0];
    var observable = _ref[1];

    return observable[_utilSymbol_observer2['default']](observer);
}
module.exports = exports['default'];