/*jshint esnext: true */
import testrunner from 'steal-qunit';
import model from 'search-widget/model/locatorModel';

var m;
testrunner.module('search-widget/model', {
    beforeEach: function () {
        m = new model({
            geocodeUrl: 'http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/'
        });
    }
});
