
import DefineList from 'can-define/list/list';
import DefineMap from 'can-define/map/map';
import CanEvent from 'can-event';
import Component from 'can-component';
import assign from 'can-util/js/assign/assign';

import template from './locator.stache!';
import './locator.less!';
import icon from './icon';

let id = 0;

/**
 * @constructor locator-widget.ViewModel ViewModel
 * @parent locator-widget
 * @group locator-widget.ViewModel.props Properties
 *
 * @description A `<locator-widget />` component's ViewModel
 */
export const ViewModel = DefineMap.extend('LocatorWidget', {
    /**
    * the url to geocode to for find and suggest endpoints
     * @property {String} locator-widget.ViewModel.props.url
     * @parent locator-widget.ViewModel.props
     */
    url: {
        value: null,
        type: 'string'
    },
    /**
    * The default level of zoom to apply if using an ol-map. The default is `18`
     * @property {Number} locator-widget.ViewModel.props.zoomLevel
     * @parent locator-widget.ViewModel.props
     */
    zoomLevel: {
        value: 18,
        type: 'number'
    },
    /**
     * whether or not to navigate the map
     * @property {Boolean} locator-widget.ViewModel.props.navigate
     * @parent locator-widget.ViewModel.props
     */
    navigate: {
        type: 'boolean',
        value: true
    },
    /**
     * a geocoder service provider
     * @property {providers.locationProvider} locator-widget.ViewModel.props.provider
     * @link providers.locationProvider Location Providers
     * @parent locator-widget.ViewModel.props
     */
    provider: {},
    map: {
        set (map) {
            this.initVectorLayer();
            return map;
        }
    },
    locations: {
        Value: DefineList
    },
    disableMultiple: {
        type: 'htmlbool',
        value: false
    },
  /**
   * @prototype
   */
  /**
   * When the map is ready, this is called internally to add a new vector layer to it and stores a reference to the map.
   * @signature
   * @param  {can.Map} map The map viewModel
   */
    initVectorLayer () {
        this.vectorLayer = new ol.layer.Vector({
            title: 'Location',
            id: 'location' + id++,
            source: new ol.source.Vector(),
            style: new ol.style.Style({
                image: new ol.style.Icon(/* @property {olx.style.IconOptions} */ ({
                    anchor: [0.5, 46],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'pixels',
                    opacity: 0.75,
                    src: icon
                }))
            })
        });
    },
    refreshSuggestions (value) {
        this.provider.searchText = value;
    },
  /**
   * Called when the search text changes to retrieve suggestions
   * @param  {String} address The text string to search for suggestions
   */
    searchAddressValue (address) {
        this.clearGraphics();
        var point;
        if (this.map) {
            var view = this.map.getView();
            point = ol.proj.transform(view.getCenter(),
              view.getProjection(), 'EPSG:4326');
            this.provider.searchPoint = point;
        }
    },
  /**
   * Called when one of the suggestions is clicked. This function kicks off the geocode by querying the provider with the qualified address or location name.
   * @signature
   * @param  {String} address The fully qualified address or string name
   */
    selectAddress: function (address) {
        this.provider.set({
            searchAddress: address,
            searchText: ''
        });
        this.provider.locationPromise.then((data) => {
            if (this.disableMultiple) {
                this.locations.replace([data]);
            } else {
                this.locations.push(data);
            }
        });
    },
    removeLocation (l) {
        const index = this.locations.indexOf(l);
        if (index !== -1) {
            this.locations.splice(index, 1);
        }
    },
  /**
   * Clears the graphics layer
   * @signature
   */
    clearGraphics: function () {
        if (this.map) {
            this.map.removeLayer(this.vectorLayer);
            this.vectorLayer.getSource().clear();
        }
    },
  /**
   * @typedef {can.Event} locator-widget.events.locationFound location-found
   * @parent locator-widget.events
   * An event dispatched when the the location is found by the provider
   * @option {providers.locationProvider.types.locationObject} location The location found by the provider
   */
  /**
   * Called internally when the address is resolved to a location by the provider
   * @signature
   * @param  {providers.locationProvider.types.locationObject} location The location object
   */
    // handleAddressLocated: function (location) {
    //     this.clearSuggestions();
    //     this.location = location;
    //     this.dispatch('location-found', [location]);
    //     if (this.navigate && this.map) {
    //         this.navigateMap(location);
    //     }
    // },
  /**
   * Pans the map to the location and adds a point to the graphics layer
   * @signature
   * @param  {providers.locationProvider.types.locationObject} location The location object
   */
    navigateMap: function (location) {
        var map = this.map;
        var coords = ol.proj.transform([location.x, location.y],
          'EPSG:4326', map.getView().getProjection());
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
        map.getView().setCenter(coords);
        map.getView().setZoom(this.zoomLevel);
        this.map.addLayer(this.vectorLayer);
        this.vectorLayer.getSource().addFeature(new ol.Feature({
            geometry: new ol.geom.Point(coords)
        }));
    }
});

assign(ViewModel.prototype, CanEvent);

export default Component.extend({
    viewModel: ViewModel,
    view: template,
    tag: 'locator-widget',
    events: {
    }
});
