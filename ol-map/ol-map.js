import can from 'can/util/library';
import CanMap from 'can/map/';
import List from 'can/list/';
import CanEvent from 'can/event/';
import 'can/map/define/';
import Component from 'can/component/';
import template from './olMap.stache!';
import './olMap.css!';

import ol from 'openlayers';
import 'node_modules/openlayers/dist/ol.css!';

import Factory from './LayerFactory';

export const ViewOptions = CanMap.extend({
  projection: 'EPSG:3857',
  minZoom: undefined,
  maxZoom: undefined,
  rotation: 0,
  extent: undefined
});

export const MapOptions = CanMap.extend({
  define: {
    layers: {
      value: function() {
        return [{
          type: 'OSM'
        }];
      }
    },
    view: {
      Value: ViewOptions
    }
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
export const ViewModel = CanMap.extend({
  /**
   * @prototype
   */
  define: {
    /**
     * Openlayers projection string to use for map. The default is `'EPSG:3857'`
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
      value: 0,
      set(x) {
        if (isNaN(x)) {
          return 0;
        }
        if (this.attr('mapObject')) {
          let view = this.attr('mapObject').getView();
          let coords = ol.proj.transform([x, this.attr('y')], this.attr('projection'), view.getProjection());
          let currentX = coords[0];
          if (currentX !== x) {
            view.setCenter(coords);
          }
        }
        return x;
      }
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
      value: 0,
      set(y) {
        if (isNaN(y)) {
          return 0;
        }
        if (this.attr('mapObject')) {
          let view = this.attr('mapObject').getView();
          let coords = ol.proj.transform([this.attr('x'), y], this.attr('projection'), view.getProjection());
          let currentY = view.getCenter()[1];
          if (coords[1] !== currentY) {
            view.setCenter(coords);
          }
        }
        return y;
      }
    },
    /**
     * The starting zoom level of the map view. The default is 1.
     * @property {Number} ol-map.ViewModel.props.zoom
     * @parent ol-map.ViewModel.props
     * @signature `zoom="5"` Sets the zoom level
     * @signature `viewModel.attr('zoom', 5)` Sets the zoom level
     *
     */
    zoom: {
      type: 'number',
      value: 1,
      set(zoom) {
        if (this.attr('mapObject')) {
          let view = this.attr('mapObject').getView();
          if (view.getZoom() !== zoom) {
            view.setZoom(zoom);
          }
        }
        return zoom;
      }
    },
    /**
     * @description
     * The deferred object used to notify listeners when the map is ready
     * @property {can.Deferred} ol-map.ViewModel.props.deferred
     * @parent ol-map.ViewModel.props
     */
    deferred: {
      value: can.Deferred
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
    }
  },
  /**
   * @function initMap
   * Initializes the map
   * @signature
   * @param  {domElement} element The dom element to place the map
   */
  initMap(element) {
    this.attr('mapOptions.layers', this.getLayers(this.attr('mapOptions.layers')));
    this.attr('mapOptions.view', this.getView(this.attr('mapOptions.view')));

    var options = can.extend({
      controls: ol.control.defaults().extend([
        new ol.control.OverviewMap(),
        new ol.control.FullScreen()
      ]),
      target: element
    }, this.attr('mapOptions').attr());
    if (this.attr('mapOptions')) {
      options = can.extend(options, this.attr('mapOptions').attr());
    }
    //create the map
    this.attr('mapObject', this.createMap(options));
  },
  /**
   * @function getLayers
   * Creates new ol layers from the provided paramters using the Layer Factory.
   * Layers are added to the map in the order of first to last, with the last appearing
   * on the bottom.
   * @param  {Array<object>} layerConf The array of layer properties to pass to the factory
   * @return {ol.Collection<ol.Layer>} The assembled layers in the correct order
   */
  getLayers(layerConf) {
    return new ol.Collection(
      layerConf.reverse().map(function(l) {
        return Factory.getLayer(l);
      }));
  },
  /**
   * @function getView
   * creates a new ol.View object from the provided paramters.
   * If a view object exists in the mapOptions, the view object's properties
   * will override the defaults including x and y properties set on this viewModel
   * @param  {[type]} viewConf [description]
   * @return {[type]}          [description]
   */
  getView(viewConf) {

    //transform the coordinates if necessary
    let center = ol.proj.transform([this.attr('x'), this.attr('y')], this.attr('projection'), this.attr('mapOptions.view.projection'));

    //create the view
    return new ol.View(
      can.extend({
        zoom: this.attr('zoom'),
        center: center
      }, viewConf.attr())
    );
  },
  /**
   * @function createmap
   * @description
   * Creates and initializes the map with the map options. Called internally.
   * @signature
   * @param  {object} options `ol.map` constructor options
   * @return {ol.map}         The map object that is now set up
   */
  createMap(options) {
    let map = new ol.Map(options);
    let view = map.getView();
    map.on('moveend', event => {
      let view = event.target.getView();

      //project to components projection
      let center = ol.proj.transform(view.getCenter(), view.getProjection(), this.attr('projection'));

      //export the properties
      this.attr({
        x: center[0],
        y: center[1],
        zoom: view.getZoom()
      });
    });
    return map;
  },
  /**
   * @function removeMap
   * Removes the map when this element is removed
   */
  removeMap() {
    this.attr('mapObject').setTarget(null);
    this.attr('mapObject', null);
  }
});

export default Component.extend({
  tag: 'ol-map',
  viewModel: ViewModel,
  template: template,
  events: {
    inserted() {
      this.viewModel.initMap(this.element.find('.ol-map-container')[0]);
    },
    removed() {
      this.viewModel.removeMap();
    }
  }
});
