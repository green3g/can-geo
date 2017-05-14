import DefineMap from 'can-define/map/map';
import DefineList from 'can-define/list/list';
import batch from 'can-event/batch/batch';
import CanEvent from 'can-event';
import Component from 'can-component';
import assign from 'can-util/js/assign/assign';
import template from './olMap.stache!';
import './olMap.css!';

// import ol from 'openlayers';
import ol from 'openlayers';
import 'node_modules/openlayers/dist/ol.css!';

import dev from 'can-util/js/dev/dev';


import Factory from './LayerFactory';

export const ViewOptions = DefineMap.extend('ViewOptions', {
    projection: {
        type: 'string',
        value: 'EPSG:3857'
    },
    minZoom: 'number',
    maxZoom: 'number',
    rotation: {
        type: 'number',
        value: 0
    },
    extent: {
        Type: DefineList
    }
});

export const MapOptions = DefineMap.extend('MapOptions', {
    layers: {
        value: function () {
            return [{
                type: 'OSM'
            }];
        }
    },
    view: {
        Value: ViewOptions
    }
});

/**
 * @constructor ol-map.ViewModel ViewModel
 * @parent ol-map
 * @group ol-map.ViewModel.props Properties
 * @group ol-map.ViewModel.topics Topics
 *
 * @description A `<ol-map />` component's ViewModel
 */
export const ViewModel = DefineMap.extend('OlMap', {
    /**
     * @prototype
     */
    /**
     * Openlayers projection string to use for the coordinates. of this viewModel.
     * The default is `'EPSG:4326'` (latitude and longitude). This projection is not
     * ecessarily the projection of the `view<ol.View>`property of the map.
     * If the coordinate systems are different, they will be converted to the view
     * projection before the map is panned.
     * @property {string} ol-map.ViewModel.props.projection
     * @parent ol-map.ViewModel.props
     * @signature `projection="EPSG:3857"` sets the projection value
     */
    projection: {
        type: 'string',
        value: 'EPSG:4326'
    },
    /**
     * The starting x coordinate of the map view. The default is 0.
     * @property {Number} ol-map.ViewModel.props.x
     * @parent ol-map.ViewModel.props
     * @signature `x="45.2123"` Sets the x value
     */
    x: {
        type: 'number',
        value: 0
    },
    /**
     *
     * The starting y coordinate of the map view. The default is 0.
     * @property {Number} ol-map.ViewModel.props.y
     * @parent ol-map.ViewModel.props
     *
     */
    y: {
        type: 'number',
        value: 0
    },
    /**
     * The starting zoom level of the map view. The default is 1.
     * @property {Number} ol-map.ViewModel.props.zoom
     * @parent ol-map.ViewModel.props
     * @signature `zoom="5"` Sets the zoom level
     * @signature `viewModel.zoom= 5` Sets the zoom level
     *
     */
    zoom: {
        type: 'number',
        value: 1
    },
    /**
     * @description
     * Optional map options to override the defaults
     * @property {object} ol-map.ViewModel.props.mapOptions
     * @parent ol-map.ViewModel.props
     */
    mapOptions: {
        Type: MapOptions,
        Value: MapOptions
    },
    /**
     * The ol.Map
     * @property {ol.Map} ol-map.ViewModel.props.mapObject
     * @parent ol-map.ViewModel.props
     */
    mapObject: {
        type: '*',
        value: null
    },
    /**
     * The animation duration in milliseconds
     * @property {ol.Map} ol-map.ViewModel.props.animationDuration
     * @parent ol-map.ViewModel.props
     */
    animationDuration: {
        type: 'number',
        value: 750
    },
    isAnimating: {
        type: 'boolean',
        value: false
    },
    /**
     * Initializes the map
     * @function initMap
     * @signature
     * @param  {domElement} element The dom element to place the map
     */
    initMap (element) {
        this.mapOptions.layers = this.getLayers(this.mapOptions.layers);
        this.mapOptions.view = this.getView(this.mapOptions.view);
        var options = assign({
            controls: ol.control.defaults().extend([
                new ol.control.OverviewMap(),
                new ol.control.FullScreen()
            ]),
            target: element
        }, this.mapOptions.serialize());

        //create the map
        this.mapObject = this.getMap(options);
    },
    /**
     * Creates new ol layers from the provided paramters using the Layer Factory.
     * Layers are added to the map in the order of first to last, with the last appearing
     * on the bottom.
     * @function getLayers
     * @param  {Array<object>} layerConf The array of layer properties to pass to the factory
     * @return {ol.Collection<ol.Layer>} The assembled layers in the correct order
     */
    getLayers (layerConf) {
        const layers = layerConf.reverse().map(function (l) {
            return Factory.getLayer(l);
        });
        return new ol.Collection(layers);
    },
    /**
     * creates a new ol.View object from the provided paramters.
     * If a view object exists in the mapOptions, the view object's properties
     * will override the defaults including x and y properties set on this viewModel
     * @function getView
     * @param  {[type]} viewConf [description]
     * @return {[type]}          [description]
     */
    getView (viewConf) {
        //transform the coordinates if necessary
        const center = ol.proj.transform([this.x, this.y], this.projection,
            this.mapOptions.view.projection);
        const viewOptions = assign({
            zoom: this.zoom,
            center: center
        }, viewConf.serialize());

        //create the view
        return new ol.View(viewOptions);
    },
    /**
     * @description
     * Creates and initializes the map with the map options. Called internally.
     * @function getMap
     * @signature
     * @param  {object} options `ol.map` constructor options
     * @return {ol.map}         The map object that is now set up
     */
    getMap (options) {
        const map = new ol.Map(options);
        map.on('click', (event) => {
            this.dispatch('click', [event, this]);
        });
        map.on('moveend', (event) => {
            const view = event.target.getView();

            // project to components projection
            const center = ol.proj.transform(

                //coordinates
                view.getCenter(),

                //from projection
                view.getProjection(),

                //to projection
                this.projection
            );
            //export the properties
            this.set({
                x: center[0],
                y: center[1],
                zoom: view.getZoom()
            });
        });
        return map;
    },
    /**
     * Removes the map when this element is removed
     * @function removeMap
     */
    removeMap () {
        this.mapObject.setTarget(null);
        this.mapObject = null;
    },
    /**
     * returns the viewModels coordinates in the map view's coordinate system
     * @function removeMap
     * @param {Number} x The x coordinate
     * @param {Number} y The y coordinate
     * @return {Array<Number>} the transformed coordinates
     */
    getTransformedCoordinates (x, y) {
        if (!this.mapObject) {
            return null;
        }
        const view = this.mapObject.getView();
        const coords = ol.proj.transform(

            //x,y or lon,lat coordinate pair
            [x, y],

            //from projection
            this.projection,

            //to projection
            view.getProjection()
        );
        return coords;
    },
    /**
     * determines if the view needs to be changed and if so begins a
     * can.batch process while asynchronously isAnimating the view changes
     * that are necessary
     */
    changeViewAsync () {
        if (this.isAnimating) {
            return;
        }
        //make sure map exists
        if (!this.mapObject) {
            return;
        }

        this.isAnimating = true;

        setTimeout(() => {
            const x = this.x,
                y = this.y,
                z = this.zoom,
                map = this.mapObject;
            let willAnimate = false;
            const view = map.getView();
            const coords = this.getTransformedCoordinates(x, y);
            const center = view.getCenter();
            if (!coords || !center) {
                dev.warn('Coords or center not calculated correctly');
                return;
            }

            //zoom
            if (z !== view.getZoom()) {
                willAnimate = true;
            }

            //pan
            //account for rounding differences
            const difference = 0.0001;
            if (Math.abs(center[0] - coords[0]) > difference ||
                Math.abs(center[1] - coords[1] > difference)) {
                willAnimate = true;
            }

            view.animate({
                zoom: z,
                center: coords
            });

            if (willAnimate) {
                batch.start();

                map.once('moveend', () => {
                    this.isAnimating = false;
                    batch.stop();
                });
            } else {
                this.isAnimating = false;
            }

        }, 100);
    }
});

assign(ViewModel.prototype, CanEvent);

export default Component.extend({
    tag: 'ol-map',
    ViewModel: ViewModel,
    view: template,
    events: {
        '{viewModel} x': function () {
            this.viewModel.changeViewAsync();
        },
        '{viewModel} y': function () {
            this.viewModel.changeViewAsync();
        },
        '{viewModel} zoom': function () {
            this.viewModel.changeViewAsync();
        },
        inserted () {
            this.viewModel.initMap(this.element.querySelector('.ol-map-container'));
        },
        removed () {
            this.viewModel.removeMap();
        }
    }
});
