/* eslint-env qunit, browser */
import q from 'steal-qunit';

import {ViewModel} from 'identify-widget/';
import IdentifyResult from './test/identify-result';
import ol from 'openlayers';

let vm, FeatureCollection, coordinate;
const clickKey = 'mykey';
const Coord = [-10566654.790142762, 5439870.428999424];
q.module('identify-widget.ViewModel', {
    beforeEach () {

        FeatureCollection = Object.assign({}, IdentifyResult);
        coordinate = [Coord[0], Coord[1]];

        //create a new viewModel for testing
        vm = new ViewModel({
            mapNode: clickKey
        });

    },
    afterEach () {
        vm = null;
    }
});

test('loading get()', (assert) => {
    const done = assert.async();
    const p = new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, 1000);
    });
    vm.promises = [p];
    console.log(vm.loading);
});

test('activeFeature get()', (assert) => {
    vm.initWidget({
        map: mapModel
    });
    let a;
    vm.addFeatures(FeatureCollection, coordinate);
    const f = vm.activeFeature;
    assert.equal(f.feature, vm.features[0], 'feature should be in the object returned');
    assert.ok(f.featureTemplate, 'feature should have a template');
    assert.ok(f.layer, 'feature should have a layer name');
    assert.ok(f.title, 'feature should have a title');
    assert.ok(f.index, 'feature should have a index number');
    for (a in f.attributes) {
        if (f.attributes.hasOwnProperty(a)) {
            assert.ok(f.attributes[a].rawValue, 'attribute should have a rawValue');
            assert.ok(f.attributes[a].value, 'attribute should have a value');
            assert.ok(f.attributes[a].alias, 'attribute should have a alias');
        }
    }

    const dummy = 'dummy';
    vm.layerProperties = {
        not_states: {
            alias: dummy,
            template: dummy,
            properties: {
                STATE_NAME: {
                    alias: dummy,
                    formatter: function () {
                        return dummy;
                    }
                }
            }
        }
    };
    assert.equal(f.feature, vm.features[0], 'feature should be in the object returned');
    assert.equal(f.featureTemplate, dummy, 'feature should have a template');
    assert.equal(f.layer, 'not_states', 'feature should have a layer name');
    assert.equal(f.title, dummy, 'feature should have a title');
    assert.ok(f.index, 'feature should have a index number');
});

//TODO: map set()
test('layer value()', (assert) => {
    assert.ok(vm.layer instanceof ol.layer.Vector, 'layer should be set correctly');
    assert.ok(vm.layer.get('title', 'layer should have a title'));
});

//TODO: test identify()
//TODO: test getQueryURLsRecursive
//TODO: test getQueryURL
//TODO: test getFeatureInfo
//TODO:
test('addFeatures', (assert) => {
    //add layerProperties to exclude the states layer
    vm.attr('layerProperties', {
        states: {
            excludeIdentify: true
        }
    });
    vm.addFeatures(FeatureCollection, coordinate);
    assert.equal(vm.attr('features').length, 2, 'features should have a length of 2 since we are excluding 2');
    vm.attr('features').forEach(function (feature) {
        assert.ok(feature.getGeometry(), 'features should have a geometry');
    });
});

//TODO: test getFeaturesFromJson
//TODO: test clearFeatures
//TODO: test zoomToFeature
//TODO: test animateZoomToExtent
//TODO: test error
//TODO: test getClosestFeatureIndex
//TODO: test getDistance
