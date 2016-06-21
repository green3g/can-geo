/*jshint esnext: true */
import q from 'steal-qunit';
import can from 'can';

import { ViewModel } from './ol-map';
import template from './test/mapTemplate.stache!';

var view = {
  center: [20, 20],
  zoom: 11
};

let vm, element;


q.module('ol-map.ViewModel', {
  beforeEach() {
    element = can.$('#qunit-fixture').append('<div id="map-node" />');
    vm = new ViewModel({

    });
  },
  afterEach() {
    vm = null;
    element = null;
  }
});

/**
 * Determines whether a points values are close enough to account for rounding
 * differences
 * @param  {Array<Number>} p The point to check
 * @param  {Array<Number>} p1 The point to compare with
 * @return {Boolean} whether or not the poitn is close to its other point
 */
function areCloseEnough(p, p2) {
  return p[0] > p2[0] - 1 && p[0] < p2[0] + 1 &&
    p[1] > p2[1] - 1 && p[1] < p2[1] + 1;
}

test('initMap with defaults', (assert) => {
  vm.initMap(element[0]);
  let map = vm.attr('mapObject');
  let view = map.getView();

  assert.equal(map.getLayers().getArray().length, 1, 'one layer should be added by default');

  let center = view.getCenter();
  assert.ok(areCloseEnough(center, [0, 0]), 'the default center should be about 0,0');
});

test('initMap with a coordinate', assert => {
  vm.attr({
    x: 10,
    y: 10
  });
  vm.initMap(element[0]);
  let map = vm.attr('mapObject');
  let view = map.getView();
  assert.deepEqual(view.getCenter(), ol.proj.transform([10, 10], 'EPSG:4326', 'EPSG:3857'), 'coordinates passed in should be projected correctly');
});

test('initMap with custom layers', assert => {
  vm.attr('mapOptions.layers', [{
    type: 'TileWMS',
    sourceOptions: {
      url: 'http://map.ices.dk/geoserver/ext_ref/wms',
      params: {
        LAYERS: 'ext_ref:bluemarble_world',
      }
    }
  }, {
    type: 'TileWMS',
    sourceOptions: {
      url: 'http://demo.opengeo.org/geoserver/topp/wms',
      params: {
        LAYERS: 'topp:states'
      }
    }
  }]);

  vm.initMap(element[0]);

  assert.equal(vm.attr('mapObject').getLayers().getArray().length, 2, 'two layers should be added to the map');
});

test('map event setCenter', assert => {
  let done = assert.async();
  vm.initMap(element[0]);

  let expected = [-90, 45];
  vm.attr('mapObject').getView().setCenter(ol.proj.transform(expected, 'EPSG:4326', 'EPSG:3857'));

  //view.setCenter must be async or something because this doesn't work
  //unless its wrapped in setTimeout
  setTimeout(() => {
    assert.ok(areCloseEnough([vm.attr('x'), vm.attr('y')], expected), 'the coordinates should approximately match the map objects center');
    done();
  }, 100);
});

test('map event setZoom', assert => {
  let done = assert.async();
  vm.initMap(element[0]);

  vm.attr('mapObject').getView().setZoom(15);

  setTimeout(() => {
    assert.equal(vm.attr('zoom'), 15, 'zoom should be set on the viewModel');
    done();
  }, 100);
});

//
// test('map destroy', assert => {
//   vm.initMap(element[0]);
//   can.$('#qunit-fixture').remove();
//   assert.notOk(vm.attr('mapObject'), 'map shouldnt exist after removing the element');
// });
