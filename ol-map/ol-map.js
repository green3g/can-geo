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
      value: 0,
      set(x) {
        if (this.attr('x') !== x) {
          setTimeout(() => {
            this.animateViewChange(x, this.attr('y'), this.attr('zoom'));
          }, 1);
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
        if (this.attr('y') !== y) {
          setTimeout(() => {
            this.animateViewChange(this.attr('x'), y, this.attr('zoom'));
          }, 1);
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
      set(z) {
        if (this.attr('zoom') !== z) {
          setTimeout(() => {
            this.animateViewChange(this.attr('x'), this.attr('y'), z);
          }, 1);
        }
        return z;
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
    },
    animationDuration: {
      type: 'number',
      value: 750
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
    this.attr('mapObject', this.getMap(options));
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
    let center = ol.proj.transform(
      [this.attr('x'), this.attr('y')],
      this.attr('projection'),
      this.attr('mapOptions.view.projection'));

    //create the view
    return new ol.View(
      can.extend({
        zoom: this.attr('zoom'),
        center: center
      }, viewConf.attr())
    );
  },
  /**
   * @function getMap
   * @description
   * Creates and initializes the map with the map options. Called internally.
   * @signature
   * @param  {object} options `ol.map` constructor options
   * @return {ol.map}         The map object that is now set up
   */
  getMap(options) {
    let map = new ol.Map(options);
    let view = map.getView();
    map.on('moveend', event => {
      let view = event.target.getView();
      //project to components projection
      let center = ol.proj.transform(

        //coordinates
        view.getCenter(),

        //from projection
        view.getProjection(),

        //to projection
        this.attr('projection')
      );
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
  },
  /**
   * returns the viewModels coordinates in the map view's coordinate system
   * @return {Array<Number>} the transformed coordinates
   */
  getTransformedCoordinates(x, y) {
    if (!this.attr('mapObject')) {
      return;
    }
    let view = this.attr('mapObject').getView();
    return ol.proj.transform(

      //x,y or lon,lat coordinate pair
      [x, y],

      //from projection
      this.attr('projection'),

      //to projection
      view.getProjection()
    );
  },
  /**
   * determines if the view needs to be changed and if so begins a
   * can.batch process while asynchronously animating the view changes
   * that are necessary
   * @param {Number} x - the x coordinate to change the view to
   * @param {Number} y - the y coordinate to change the view to
   * @param {Number} z - the zoom level to change the view to
   */
  animateViewChange(x, y, z) {
    //make sure map exists
    if (!this.attr('mapObject')) {
      return;
    }
    let map = this.attr('mapObject');
    let view = map.getView();
    let coords = this.getTransformedCoordinates(x, y);
    let center = view.getCenter();
    if (this.attr('animating')) {
      return;
    }


    //do the animation
    let zoom, pan;
    //zoom animation

    if (z !== view.getZoom()) {
      zoom = ol.animation.zoom({
        duration: this.attr('animationDuration'),
        resolution: map.getView().getResolution()
      });
      //register animations
      map.beforeRender(zoom);
      view.setZoom(z);
    }

    //pan animation
    //account for rounding differences
    let difference = 0.0001;
    if (Math.abs(center[0] - coords[0]) > difference ||
      Math.abs(center[1] - coords[1] > difference)) {
      pan = ol.animation.pan({
        duration: this.attr('animationDuration'),
        source: map.getView().getCenter()
      });
      //register animations
      map.beforeRender(pan);
      view.setCenter(coords);
    }

    if (zoom || pan) {
      can.batch.start();

      map.once('moveend', () => {
        can.batch.stop();
      });
    }
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
