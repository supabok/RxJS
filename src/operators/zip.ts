import Operator from '../Operator';
import Observer from '../Observer';
import Scheduler from '../Scheduler';
import Observable from '../Observable';
import Subscriber from '../Subscriber';

import ArrayObservable from '../observables/ArrayObservable';

import tryCatch from '../util/tryCatch';
import {errorObject} from '../util/errorObject';

export function zip<T, R>(...observables: (Observable<any> | ((...values: Array<any>) => R))[]): Observable<R> {
  const project = <((...ys: Array<any>) => R)> observables[observables.length - 1];
  if (typeof project === "function") {
    observables.pop();
  }
  return new ArrayObservable(observables).lift(new ZipOperator(project));
}

export function zipProto<R>(...observables: (Observable<any> | ((...values: Array<any>) => R)) []): Observable<R> {
  return zip.apply(this, [this, ...observables]);
}

export class ZipOperator<T, R> implements Operator<T, R> {

  project: (...values: Array<any>) => R

  constructor(project?: (...values: Array<any>) => R) {
    this.project = project;
  }

  call(observer: Observer<R>): Observer<T> {
    return new ZipSubscriber<T, R>(observer, this.project);
  }
}

export class ZipSubscriber<T, R> extends Subscriber<T> {

  values: any;
  active: number = 0;
  observables: Observable<any>[] = [];
  project: (...values: Array<any>) => R;
  limit: number = Number.POSITIVE_INFINITY;

  constructor(destination: Observer<R>,
              project?: (...values: Array<any>) => R,
              values: any = Object.create(null)) {
    super(destination);
    this.project = (typeof project === "function") ? project : null;
    this.values = values;
  }

  _next(observable) {
    this.observables.push(observable);
  }

  _complete() {

    const values = this.values;
    const observables = this.observables;

    let index = -1;
    const len = observables.length;

    this.active = len;

    while(++index < len) {
      this.add(this._subscribeInner(observables[index], values, index, len));
    }
  }

  _subscribeInner(observable, values, index, total) {
    return observable.subscribe(new ZipInnerSubscriber(this, values, index, total));
  }

  _innerComplete(innerSubscriber) {
    if((this.active -= 1) === 0) {
      this.destination.complete();
    } else {
      this.limit = innerSubscriber.events;
    }
  }
}

export class ZipInnerSubscriber<T, R> extends Subscriber<T> {

  parent: ZipSubscriber<T, R>;
  values: any;
  index: number;
  total: number;
  events: number = 0;

  constructor(parent: ZipSubscriber<T, R>, values: any, index : number, total : number) {
    super(parent.destination);
    this.parent = parent;
    this.values = values;
    this.index = index;
    this.total = total;
  }

  _next(x) {

    const parent = this.parent;
    const events = this.events;
    const limit = parent.limit;

    if (events >= limit) {
      this.destination.complete();
      return;
    }

    const index = this.index;
    const values = this.values;
    const zipped = values[events] || (values[events] = []);

    zipped[index] = [x];

    if (zipped.length === this.total && zipped.every(hasValue)) {
      this._projectNext(zipped, parent.project);
      values[events] = undefined;
    }

    this.events = events + 1;
  }

  _projectNext(values: Array<any>, project?: (...xs: Array<any>) => R) {
    if(project && typeof project === "function") {
      const result = tryCatch(project).apply(null, values.map(mapValue));
      if(result === errorObject) {
        this.destination.error(errorObject.e);
        return;
      } else {
        this.destination.next(result);
      }
    } else {
      this.destination.next(values.map(mapValue));
    }
  }

  _complete() {
    this.parent._innerComplete(this);
  }
}

export function mapValue(xs) { return xs[0]; }
export function hasValue(xs) { return xs && xs.length === 1; }
