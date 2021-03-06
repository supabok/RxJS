/* globals describe, it, expect */
var Rx = require('../../dist/cjs/Rx');
var Observable = Rx.Observable;

describe('Observable.of', function () {
  it('should create an observable from the provided values', function (done) {
    var x = { foo: 'bar' };
    var expected = [1, 'a', x];
    var i = 0;
    Observable.of(1, 'a', x)
      .subscribe(function (x) {
          expect(x).toBe(expected[i++]);
        }, null,
        function () {
          done();
        });
  });
});