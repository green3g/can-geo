/*jshint esnext: true */
import q from 'steal-qunit';
import ol from 'openlayers';

import {
    ViewModel
} from './ol-map';
import template from './test/mapTemplate.stache!';
import $ from 'jquery';

var view = {
    center: [20, 20],
    zoom: 11
};

let vm, element;


q.module('ol-map.ViewModel', {
    beforeEach() {
        element = $('#qunit-fixture').append('<div id="map-node" />');
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
    return Math.abs(p[0] - p2[0]) < 1 &&
        Math.abs(p[1] - p2[1]) < 1;
}
