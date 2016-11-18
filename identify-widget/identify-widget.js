
import featureTemplate from './featureTemplate.stache!';
import template from './template.stache!';
import './styles.less!';

import 'spectre-canjs/property-table/property-table';
import 'spectre-canjs/paginate-widget/paginate-widget';
import {parseFieldArray} from 'spectre-canjs/util/field';
import ajax from 'can-util/dom/ajax/ajax';
import assign from 'can-util/js/assign/assign';
import DefineMap from 'can-define/map/map';
import Component from 'can-component';
import DefineList from 'can-define/list/list';
import ol from 'openlayers';

import canViewModel from 'can-view-model';

/**
 * @constructor identify-widget.ViewModel ViewModel
 * @parent identify-widget
 * @group identify-widget.ViewModel.props Properties
 *
 * @description A `<identify-widget />` component's ViewModel
 */
export const ViewModel = DefineMap.extend('IdentifyWidget', {
  /**
   * @prototype
   */
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
        Value: DefineMap
    },
    /**
     * The list of features that have been identified
     * @property {Array<ol.Feature>} identify-widget.ViewModel.props.features
     * @parent identify-widget.ViewModel.props
     */
    features: {
        Value: DefineList
    },
    /**
     * Whether or not all identifies have completed. This is used internally by the template.
     * @property {can.Deferred} identify-widget.ViewModel.props.loading
     * @parent identify-widget.ViewModel.props
     */
    loading: {
        get () {
            return Promise.all(this.promises);
        }
    },
    /**
     * A list of pending identify deferreds
     * @property {Array<can.Deferred>} identify-widget.ViewModel.props.promises
     * @parent identify-widget.ViewModel.props
     */
    promises: {
        Value: DefineList
    },
    /**
     * The currently selected feature index
     * @property {Number} identify-widget.ViewModel.props.activeFeatureIndex
     * @parent identify-widget.ViewModel.props
     */
    activeFeatureIndex: {
        value: 0,
        type: 'number'
    },
    /**
     * A virtual property that returns an object consisting of the formatted fields, values, and layer properties.
     * @property {can.Map} identify-widget.ViewModel.props.activeFeature
     * @parent identify-widget.ViewModel.props
     */
    activeFeature: {
        get () {
            //if no features, return null
            if (!this.features.length) {
                //update Map layer
                this.updateSelectedFeature(null);
                return null;
            }

            //get this active feature by array index
            const feature = this.features[this.activeFeatureIndex];

            //update Map layer
            this.updateSelectedFeature(feature);

            //get the layer key name. Layer id is returned from wms by LayerName.fetureID
            let layer = feature.getId().split('.');
            const index = layer[1];
            layer = layer[0];

            //get the configured layer properties object key this.layerProperties.layerName
            const layerProperties = this.layerProperties[layer];
            let title, templ, fields;

            //if its provided parse the alias and formatters
            if (layerProperties) {

                //set the layer alias
                title = layerProperties.alias;

                //set the correct template for this feature this.layerproperties.layername.template
                templ = layerProperties.template;

                // set up the fields
                fields = layerProperties.fields;
            } else {
                fields = Object.keys(feature.getProperties());
            }

            return {
                //raw ol.feature
                feature: feature,
                //feature property values
                properties: feature.getProperties(),
                //get the field properties like alias and formatters this.layerproperties.layername.properties
                fields: parseFieldArray(fields),
                //feature template
                featureTemplate: templ || featureTemplate,
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
        set (map) {
            if (map) {
                map.on('click', (event) => {
                    this.identify(event.coordinate);
                });
                map.addLayer(this.layer);
            }
            return map;
        }
    },
    /**
     * the openlayers vector layer in which features are identified on
     * @property {ol.layer.Vector} identify-widget.ViewModel.props.layer
     * @parent identify-widget.ViewModel.props
     */
    layer: {
        type: '*',
        value: function () {
            const source = new ol.source.Vector({
                features: []
            });
            return new ol.layer.Vector({
                title: 'Identify Results',
                id: this.id,
                source: source,
                excludeControl: true
            });
        }
    },
    /**
     * The popup viewModel. If provided, the identify widget will move the popup
     * to each feature as it is identified
     * @property {ol.layer.Vector} identify-widget.ViewModel.props.popup
     * @parent identify-widget.ViewModel.props
     */
    popup: {
        value: null
    },
    /**
     * A selector for a ol-popup node, for example `#identify-popup` or `ol-popup`
     * If provided, the identify widget will automatically set this `popup`
     * property using `can-view-model`
     * @property {String} identify-widget.ViewModel.props.popupSelector
     * @parent identify-widget.ViewModel.props
     */
    popupSelector: 'string',
    /**
     * Whether or not this widget should actively identify features on the map
     * set this to true to turn on identifying
     * @property {Boolean}  identify-widget.ViewModel.props.active
     * @parent identify-widget.ViewModel.props
     */
    active: 'htmlbool',
  /**
   * @function identify
   * Queries the available map wms layers and updates the loading status
   * @signature
   * @param  {ol.events.Event} event The click event dispatched by the map
   * @param  {Array<Number>} coordinate Optional coordinate array to identify at
   * @return {Promise} A promise that is resolved when all of the identifies have finished loading
   */
    identify (event, coordinate) {
        if (!this.active) {
            return;
        }
        if (!coordinate) {
            coordinate = event;
        }
        this.clearFeatures();
        this.hasError = null;
        const layers = this.map.getLayers();
        const urls = this.getQueryURLsRecursive(layers, coordinate);
        const deferreds = [];
        urls.forEach((url) => {
            const def = this.getFeatureInfo(url);
            deferreds.push(def);
        });
        let resolved = 0;
        deferreds.forEach((d) => {
            d.then((json) => {
                this.addFeatures(json, coordinate);
                resolved++;
                // self.updateLoading(resolved, deferreds.length);
            }).catch((e) => {
                this.error(e);
                resolved++;
                // self.updateLoading(resolved, deferreds.length);
            });
        });
        this.promises = deferreds;
        return this.loading;
    },
  /**
   * @function getQueryURLsRecursive
   * Recursively queries wms layers for identify results. Recursion is used to drill into group layers
   * @signature
   * @param  {ol.Collection<ol.Layer>} layers     A collection (array) of layers
   * @param  {Array<Number>} coordinate The current identify coordinate
   * @return {Array<String>}            Array of GetFeatureInfo urls
   */
    getQueryURLsRecursive (layers, coordinate) {
        let urls = [];
        layers.forEach((layer) => {
            if (layer.getVisible() && !layer.get('excludeIdentify')) {
                if (layer instanceof ol.layer.Group) {
                    urls = urls.concat(this.getQueryURLsRecursive(layer.getLayers(), coordinate));
                } else {
                    const url = this.getQueryURL(layer, coordinate);
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
    getQueryURL (layer, coordinate) {
        if (layer.getSource && layer.getVisible()) {
            const source = layer.getSource();
            if (source && typeof source.getGetFeatureInfoUrl !== 'undefined') {
                const map = this.map;
                const view = map.getView();
                return source.getGetFeatureInfoUrl(
                  coordinate,
                  view.getResolution(),
                  view.getProjection(), {
                      'INFO_FORMAT': 'application/json',
                      'FEATURE_COUNT': this.maxFeatureCount,
                      'BUFFER': this.featureBuffer
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
    getFeatureInfo (url) {
        return ajax({
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
    addFeatures (collection, coordinate) {
        if (collection.features.length) {
            let features = [];
            collection.features.forEach((feature) => {

                //if this layer should be excluded, skip it
                //path to exclude is this.layerproperties.layerName.excludeIdentify
                const layer = feature.id.split('.')[0];
                const exclude = this.layerProperties[layer] && this.layerProperties[layer].excludeIdentify;
                if (!exclude) {

                    //otherwise, add the crs to each feature
                    feature.crs = collection.crs;
                    features.push(feature);
                }
            });
            const newCollection = assign(collection, {
                features: features
            });
            features = this.getFeaturesFromJson(newCollection);
            if (!this.features.length) {
                const index = this.getClosestFeatureIndex(features, coordinate);
                if (index) {
                    //swap the feature for the first so it shows up first
                    const temp = features[index];
                    features[index] = features[0];
                    features[0] = temp;
                }
            }
            this.features = this.features.concat(features);
        }
    },
  /**
   * @function getFeaturesFromJson
   * Converts raw geojson into openlayers features
   * @signature
   * @param  {Object } collection Raw GeoJSON object
   * @return {ol.Collection<ol.Feature>}            The collection of openlayers features
   */
    getFeaturesFromJson (collection) {
        const proj = this.map.getView().getProjection();
        const gjson = new ol.format.GeoJSON();
        const features = gjson.readFeatures(collection, {
            dataProjection: gjson.readProjection(collection),
            featureProjection: proj
        });
        return features;
    },
  /**
   * @function clearFeatures
   * clears the features in this widget
   * @signature
   */
    clearFeatures () {
        this.promises.forEach((p) => {
            p.abort();
        });
        this.features.replace([]);
        this.updateSelectedFeature(null);
        this.activeFeatureIndex = 0;
    },
  /**
   * @function updateSelectedFeature
   * Updates the currently selected feature and replaces the table attributes and the vector layer with the new feature
   * @signature
   * @param  {ol.Feature} feature The feature
   */
    updateSelectedFeature (feature) {
        if (!feature) {
            this.layer.getSource().clear();
            return;
        }

        const source = this.layer.getSource();
        source.clear();
        source.addFeature(feature);
        if (this.popup) {
            const extent = feature.getGeometry().getExtent();
            this.popup.showPopup(ol.extent.getCenter(extent));
        }
        return;
    },
  /**
   * @function zoomToFeature
   * Zooms the map to a feature
   * @signature
   * @param  {Object} object An object containing a feature property
   */
    zoomToFeature (object) {
        const extent = object.feature
      .getGeometry()
      .getExtent();

        if (this.popup) {
            const key = this.map.on('postrender', () => {
                this.popup.showPopup(ol.extent.getCenter(extent));
                this.map.unByKey(key);
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
    animateZoomToExtent (extent) {
        const map = this.map;
        const duration = 750;
        const pan = ol.animation.pan({
            duration: duration,
            source: map.getView().getCenter()
        });
        const zoom = ol.animation.zoom({
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
    error (e) {
        this.hasErrors = true;
        console.warn('Could not perform ajax request: ', e);
    },
  /**
   * @function getClosestFeatureIndex
   * finds the closest feature to the coordinate and returns that feature index
   * @signature
   * @param  {ol.feature[]} features The array of features to search through
   * @return {Number}          The index value of the closest feature
   */
    getClosestFeatureIndex (features, coord) {
        if (features.length === 0) {
            return 0;
        }
        let current = 0;
        let currentDistance = 99999;
        const getDistance = this.getDistance;
        features.forEach(function (feature, index) {
            const center = ol.extent.getCenter(feature.getGeometry().getExtent());
            const distance = getDistance(center, coord);
            if (distance < currentDistance) {
                currentDistance = distance;
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
    getDistance (c1, c2) {
        return Math.sqrt(
      Math.pow((c1[0] - c2[0]), 2) +
      Math.pow((c1[1] - c2[1]), 2)
    );
    }
});

export default Component.extend({
    tag: 'identify-widget',
    view: template,
    viewModel: ViewModel,
    events: {
        inserted () {
            if (this.viewModel.popupSelector) {
                this.viewModel.popup = canViewModel(document.querySelector(this.viewModel.popupSelector));
            }
        },
        removed () {
            if (this.map) {
                this.map.removeLayer(this.layer);
                this.layer = null;
                this.map = null;
            }
        }
    }
});
