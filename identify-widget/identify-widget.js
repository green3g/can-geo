import CanMap from 'can/map/';
import Component from 'can/component/';
import List from 'can/list/';
import can from 'can/util/library';
import 'can/map/define/';
import ol from 'openlayers';
import featureTemplate from './featureTemplate.stache!';
import template from './template.stache!';
import './styles.css!';

import 'can-crud/property-table/';
import { parseFieldArray } from 'can-crud/util/field';

/**
 * @constructor identify-widget.ViewModel ViewModel
 * @parent identify-widget
 * @group identify-widget.ViewModel.props Properties
 *
 * @description A `<identify-widget />` component's ViewModel
 */
export const ViewModel = CanMap.extend({
  /**
   * @prototype
   */
  define: {
    /**
     * The max number of features to return for each layer. The default is 10.
     * @signature `{Number}` `max-feature-count="10"`
     * @property {Number} identify-widget.ViewModel.props.maxFeatureCount
     * @parent identify-widget.ViewModel.props
     */
    maxFeatureCount: {
      type: 'number',
      value: 10
    },
    /**
     * Buffer distance in pixels around the map click. The default is 10.
     * @signature `{Number}` `feature-buffer="10"`
     * @property {Number} identify-widget.ViewModel.props.featureBuffer
     * @parent identify-widget.ViewModel.props
     */
    featureBuffer: {
      type: 'number',
      value: 10
    },
    /**
     * Layer configuration properties
     * @property {geo.types.LayerPropertiesObject} identify-widget.ViewModel.props.layerProperties
     * @parent identify-widget.ViewModel.props
     */
    layerProperties: {
      Value: CanMap
    },
    /**
     * The list of features that have been identified
     * @property {Array<ol.Feature>} identify-widget.ViewModel.props._features
     * @parent identify-widget.ViewModel.props
     */
    _features: {
      Value: List
    },
    /**
     * Whether or not all identifies have completed. This is used internally by the template.
     * @property {can.Deferred} identify-widget.ViewModel.props._loading
     * @parent identify-widget.ViewModel.props
     */
    _loading: {
      get() {
        return Promise.all(this.attr('_deferreds'));
      }
    },
    /**
     * A list of pending identify deferreds
     * @property {Array<can.Deferred>} identify-widget.ViewModel.props._deferreds
     * @parent identify-widget.ViewModel.props
     */
    _deferreds: {
      Value: List
    },
    /**
     * The currently selected feature index
     * @property {Number} identify-widget.ViewModel.props._activeFeatureIndex
     * @parent identify-widget.ViewModel.props
     */
    _activeFeatureIndex: {
      value: 0,
      type: 'number'
    },
    /**
     * If the feature list has one or more features after the selected feature, this will be true. This is used by the template to enable/disable the forward and back buttons.
     * @property {Boolean} identify-widget.ViewModel.props._hasNextFeature
     * @parent identify-widget.ViewModel.props
     */
    _hasNextFeature: {
      get() {
        return this.attr('_activeFeatureIndex') < this.attr('_features').length - 1;

      }
    },
    /**
     * If the feature list has one or more features before the selected feature, this will be true. This is used by the template to enable/disable the forward and back buttons.
     * @property {Boolean} identify-widget.ViewModel.props._hasPreviousFeature
     * @parent identify-widget.ViewModel.props
     */
    _hasPreviousFeature: {
      get() {
        return this.attr('_activeFeatureIndex') > 0;
      }
    },
    /**
     * A virtual property that returns an object consisting of the formatted fields, values, and layer properties.
     * @property {can.Map} identify-widget.ViewModel.props._activeFeature
     * @parent identify-widget.ViewModel.props
     */
    _activeFeature: {
      get() {
        //if no _features, return null
        if (!this.attr('_features').length) {
          //update Map layer
          this.updateSelectedFeature(null);
          return null;
        }

        //get this active feature by array index
        var feature = this.attr('_features')[this.attr('_activeFeatureIndex')];

        //update Map layer
        this.updateSelectedFeature(feature);

        //get the layer key name. Layer id is returned from wms by LayerName.fetureID
        var layer = feature.getId().split('.');
        var index = layer[1];
        layer = layer[0];

        //get the configured layer properties object key this.layerProperties.layerName
        var layerProperties = ['layerProperties', layer].join('.');
        var template, fieldProperties, prop;
        var title;

        //if its provided parse the alias and formatters
        if (this.attr(layerProperties)) {

          //set the layer alias
          title = this.attr([layerProperties, 'alias'].join('.'));

          //set the correct template for this feature this.layerproperties.layername.template
          template = this.attr([layerProperties, 'template'].join('.'));
        }

        let fields = this.attr([layerProperties, 'fields'].join('.')) || CanMap.keys(new CanMap(feature.getProperties()));
        return {
          //raw ol.feature
          feature: feature,
          //feature property values
          properties: feature.getProperties(),
          //get the field properties like alias and formatters this.layerproperties.layername.properties
          fields: parseFieldArray(fields),
          //feature template
          featureTemplate: template || featureTemplate,
          //the default template in case the other template wants to use it
          defaultTemplate: featureTemplate,
          layer: layer,
          title: title || layer,
          index: index
        };
      }
    },
    /**
     * The map object to bind a click event handler. Note: this should be removed
     * and put into a separate module. Idealy we could instead use this identify-widget
     * simply to hold the results from any map click identify.
     * @property {ol.Map} identify-widget.ViewModel.props.map
     * @parent identify-widget.ViewModel.props
     */
    map: {
      type: '*',
      set(map) {
        if (map) {
          map.on('click', event => {
            this.identify(event.coordinate);
          });
        }
        return map;
      }
    }
  },
  /**
   * @function identify
   * Queries the available map wms layers and updates the loading status
   * @signature
   * @param  {ol.events.Event} event The click event dispatched by the map
   * @param  {Array<Number>} coordinate Optional coordinate array to identify at
   * @return {Promise} A promise that is resolved when all of the identifies have finished loading
   */
  identify(event, coordinate) {
    if (!coordinate) {
      coordinate = event;
    }
    this.clearFeatures();
    var self = this;
    this.attr('hasError', null);
    var layers = this.attr('map').getLayers();
    var urls = this.getQueryURLsRecursive(layers, coordinate);
    var deferreds = [];
    urls.forEach(function(url) {
      var def = self.getFeatureInfo(url);
      deferreds.push(def);
    });
    var resolved = 0;
    deferreds.forEach(function(d) {
      d.then(function(json) {
        self.addFeatures(json, coordinate);
        resolved++;
        // self.updateLoading(resolved, deferreds.length);
      }).fail(function(e) {
        self.error(e);
        resolved++;
        // self.updateLoading(resolved, deferreds.length);
      });
    });
    this.attr('_deferreds', deferreds);
    return this.attr('_loading');
  },
  /**
   * @function getQueryURLsRecursive
   * Recursively queries wms layers for identify results. Recursion is used to drill into group layers
   * @signature
   * @param  {ol.Collection<ol.Layer>} layers     A collection (array) of layers
   * @param  {Array<Number>} coordinate The current identify coordinate
   * @return {Array<String>}            Array of GetFeatureInfo urls
   */
  getQueryURLsRecursive(layers, coordinate) {
    var self = this;
    var urls = [];
    layers.forEach(function(layer) {
      if (layer.getVisible() && !layer.get('excludeIdentify')) {
        if (layer instanceof ol.layer.Group) {
          urls = urls.concat(self.getQueryURLsRecursive(layer.getLayers(), coordinate));
        } else {
          var url = self.getQueryURL(layer, coordinate);
          if (url) {
            urls.push(url);
          }
        }
      }
    });
    return urls;
  },
  /**
   * @function getQueryURL
   * Creates a wms getGetFeatureInfo url
   * @signature
   * @param  {ol.layer} layer      The wms layer
   * @param  {Array<Number>} coordinate The coordinate pair to identify at
   * @return {String}            The url to query for identify results
   */
  getQueryURL(layer, coordinate) {
    if (layer.getSource && layer.getVisible()) {
      var source = layer.getSource();
      if (source && typeof source.getGetFeatureInfoUrl !== 'undefined') {
        var map = this.attr('map');
        var view = map.getView();
        return source.getGetFeatureInfoUrl(
          coordinate,
          view.getResolution(),
          view.getProjection(), {
            'INFO_FORMAT': 'application/json',
            'FEATURE_COUNT': this.attr('maxFeatureCount'),
            'BUFFER': this.attr('featureBuffer')
              //'QUERY_LAYERS': 'only_query_these_layers'
          });
      }
    }
  },
  /**
   * @function getFeatureInfo
   * Queries the wms endpoint for identify results
   * @signature
   * @param  {String} url The url to query
   * @return {Deferred}     The deferred that is resolved to the raw wms feature data
   */
  getFeatureInfo(url) {
    return can.ajax({
      url: url,
      dataType: 'json',
      method: 'GET'
    });
  },
  /**
   * @function addFeatures
   * Adds features to this widgets collection after a layer has been identified
   * @signature
   * @param  {Object} collection A GeoJSON feature collection
   * @param  {Array<Number>} coordinate The coordinate pair where the mouse click occurred
   */
  addFeatures(collection, coordinate) {
    if (collection.features.length) {
      var features = [];
      collection.features.forEach((feature, index) => {
        //if this layer should be excluded, skip it
        //path to exclude is this.layerproperties.layerName.excludeIdentify
        var layer = feature.id.split('.')[0];
        var exclude = this.attr(['layerProperties', layer, 'excludeIdentify'].join('.'));
        if (!exclude) {
          //otherwise, add the crs to each feature
          feature.crs = collection.crs;
          features.push(feature);
        }
      });
      var newCollection = can.extend(collection, {
        features: features
      });
      features = this.getFeaturesFromJson(newCollection);
      if (!this.attr('_features').length) {
        var index = this.getClosestFeatureIndex(features, coordinate);
        if (index) {
          //swap the feature for the first so it shows up first
          var temp = features[index];
          features[index] = features[0];
          features[0] = temp;
        }
      }
      this.attr('_features', this.attr('_features').concat(features));
    }
  },
  /**
   * @function getFeaturesFromJson
   * Converts raw geojson into openlayers features
   * @signature
   * @param  {Object } collection Raw GeoJSON object
   * @return {ol.Collection<ol.Feature>}            The collection of openlayers features
   */
  getFeaturesFromJson(collection) {
    var proj = this.attr('map').getView().getProjection();
    var gjson = new ol.format.GeoJSON();
    var features = gjson.readFeatures(collection, {
      dataProjection: gjson.readProjection(collection),
      featureProjection: proj
    });
    return features;
  },
  /**
   * @function gotoNext
   * Navigates the identify widget to the next feature by incrementing the active feature index
   * @signature
   * @return {can.Map} This object
   */
  gotoNext() {
    if (this.attr('_hasNextFeature')) {
      this.attr('_activeFeatureIndex', this.attr('_activeFeatureIndex') + 1);
    }
    return this;
  },
  /**
   * @function gotoPrevious
   * Navigates the identify widget to the previous feature by decrementing the active feature index
   * @signature
   * @return {can.Map} This object
   */
  gotoPrevious() {
    if (this.attr('_hasPreviousFeature')) {
      this.attr('_activeFeatureIndex', this.attr('_activeFeatureIndex') - 1);
    }
    return this;
  },
  /**
   * @function clearFeatures
   * clears the features in this widget
   * @signature
   */
  clearFeatures() {
    this.attr('_deferreds').forEach((d) => {
      if (d.state() === 'pending') {
        d.abort();
      }
    });
    this.attr('_features').replace([]);
    this.updateSelectedFeature(null);
    this.attr('_activeFeatureIndex', 0);
  },
  /**
   * @function updateSelectedFeature
   * Updates the currently selected feature and replaces the table attributes and the vector layer with the new feature
   * @signature
   * @param  {ol.Feature} feature The feature
   */
  updateSelectedFeature(feature) {
    if (!feature) {
      if (this.attr('layer')) {
        this.attr('layer').getSource().clear();
      }
      return;
    }
    var source;
    if (this.attr('layer')) {
      source = this.attr('layer').getSource();
      source.clear();
      source.addFeature(feature);
      return;
    }
    source = new ol.source.Vector({
      features: [feature]
    });
    var layer = new ol.layer.Vector({
      title: 'Identify Results',
      id: this.attr('id'),
      source: source,
      excludeControl: true
    });
    this.attr('layer', layer);
    this.attr('map').addLayer(layer);
  },
  /**
   * @function zoomToFeature
   * Zooms the map to a feature
   * @signature
   * @param  {Object} object An object containing a feature property
   */
  zoomToFeature(object) {
    var extent = object.feature
      .getGeometry()
      .getExtent();

    if (this.attr('popupModel')) {
      var key = this.attr('map').on('postrender', () => {
        this.attr('popupModel').centerPopup(ol.extent.getCenter(extent));
        this.attr('map').unByKey(key);
      });
    }

    this.animateZoomToExtent(extent);
  },
  /**
   * @function animateZoomToExtent
   * Zooms the map to an extent and creates the zoom animation
   * @signature
   * @param  {Array<Number>} extent The extent to zoom the map to
   */
  animateZoomToExtent(extent) {
    var map = this.attr('map');
    var duration = 750;
    var pan = ol.animation.pan({
      duration: duration,
      source: map.getView().getCenter()
    });
    var zoom = ol.animation.zoom({
      duration: duration,
      resolution: map.getView().getResolution()
    });
    map.beforeRender(pan, zoom);
    map.getView().fit(
      extent, map.getSize(), [50, 50, 50, 50]);
  },
  /**
   * @function error
   * An error logging function for failed ajax requests
   * @signature
   * @param  {Error} e The error
   */
  error(e) {
    this.attr('hasErrors', true);
    console.warn('Could not perform ajax request: ', e);
  },
  /**
   * @function getClosestFeatureIndex
   * finds the closest feature to the coordinate and returns that feature index
   * @signature
   * @param  {ol.feature[]} features The array of features to search through
   * @return {Number}          The index value of the closest feature
   */
  getClosestFeatureIndex(features, coord) {
    if (features.length === 0) {
      return 0;
    }
    var current = 0;
    var current_distance = 99999;
    var getDistance = this.getDistance;
    features.forEach(function(feature, index) {
      var center = ol.extent.getCenter(feature.getGeometry().getExtent());
      var distance = getDistance(center, coord);
      if (distance < current_distance) {
        current_distance = distance;
        current = index;
      }
    });
    return current;
  },
  /**
   * @function getDistance
   * Gets the approximate distance value for two coordinates.
   * Not to be used for measuring as it uses a simple distance calculation
   * and does not take the earth's curvature into consideration
   * @signature
   * @param  {Number[]} c1 The first xy coordinate
   * @param  {Number[]} c2 The second xy coordinate
   * @return {Number}    The distance between the two points
   */
  getDistance(c1, c2) {
    return Math.sqrt(
      Math.pow((c1[0] - c2[0]), 2) +
      Math.pow((c1[1] - c2[1]), 2)
    );
  }
});

export default Component.extend({
  tag: 'identify-widget',
  template: template,
  viewModel: ViewModel
});
