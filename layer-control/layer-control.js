import DefineMap from 'can-define/map/map';

import DefineList from 'can-define/list/list';
import Component from 'can-component';
import stache from 'can-stache';
import template from './layercontrol.stache!';
import './layercontrol.less!';
import ol from 'openlayers';

const controlTemplates = {
    'default': '<layer-control-default {layer}="." />',
    'Group': '<layer-control-group {layer}="." />',
    'TileWMS': '<layer-control-tilewms {layer}="." />'
};
/**
 * @constructor layer-control.ViewModel ViewModel
 * @parent layer-control
 * @group layer-control.ViewModel.props Properties
 *
 * @description A `<layer-control />` component's ViewModel
 */
export const ViewModel = DefineMap.extend('LayerControl', {
    /**
     * @prototype
     */
    /**
     * An internal list of layers used by the template
     * @property {Array<geo.types.ControlLayerObject>} layer-control.ViewModel.props.layers
     * @parent layer-control.ViewModel.props
     */
    layers: {
        Value: DefineList
    },
    /**
     * The openlayers map. Instead of providing a reference to ol-map component, you can provide a `ol.Map` object directly.
     * @property {ol.Map} layer-control.ViewModel.props.map
     * @parent layer-control.ViewModel.props
     */
    map: {
        type: '*',
        value: null,
        set (map) {
            if (map) {
                this.initLayers(map.getLayers());
            } else {
                this.layers.replace([]);
            }
            return map;
        }
    },
    /**
     * Calls `addLayer` for each layer currently in the collection and binds to the add/remove events of the collection
     * @param  {ol.Collection} collection The collection of layers
     */
    initLayers (collection) {
        this.layers = collection.getArray().map((l) => {
            return {
                exclude: l.get('excludeControl'),
                title: l.get('title') || 'Layer',
                visible: l.getVisible(),
                layer: l,
                template: this.getLayerTemplate(l)
            };
        }).reverse();

        //bind listeners for collection changes
        collection.on('add', (event) => {
            //find the index of the added layer
            collection.forEach((layer, index) => {
                if (event.element === layer) {
                    //we're creating a reversed array from that of the ol.collection
                    var newIndex = collection.getLength() - index - 1;
                    this.addLayer(event.element, newIndex);
                }
            });
        });

        collection.on('remove', (event) => {
            this.removeLayerById(event.element.get('id'));
        });
    },
    /**
     * Adds a layer to the view models collection
     * @param  {ol.Layer} layer The layer to add
     * @param  {Number} index The layer's position in the collection
     */
    addLayer: function (layer, index) {
        var filteredLayers = this.layers.filter(function (l) {
            return l.id === layer.get('id');
        });
        if (filteredLayers.length === 0) {
            const props = {
                exclude: layer.get('excludeControl'),
                title: layer.get('title') || 'Layer',
                visible: layer.getVisible(),
                layer: layer,
                template: this.getLayerTemplate(layer)
            };
            this.layers.splice(index, 0, props);
        }
    },
    /**
     * Removes a layer
     * @param  {String} id The unique layer id
     * @return {Boolean} The result of the remove, true if successful, false if
     * the layer was not found
     */
    removeLayerById: function (id) {
        this.layers.each((layer, index) => {
            if (layer.layer.get('id') === id) {
                this.layers.splice(index, 1);
                return false;
            }
            return true;
        });
        return true;
    },
    /**
     * Returns a template renderer for the layer
     * @param  {ol.Layer} layer The layer to find the template renderer for
     * @return {can.stache}       The stache renderer
     */
    getLayerTemplate: function (layer) {
        var templ;
        //handle layers without sources
        if (!layer.getSource) {
            for (templ in controlTemplates) {
                if (controlTemplates.hasOwnProperty(templ) &&
                    ol.layer[templ] &&
                    layer instanceof ol.layer[templ]) {
                    return stache(controlTemplates[templ]);
                }
            }
            return stache(controlTemplates.default);
        }
        //handle layer sources for more specific
        //layer types
        var layerSource = layer.getSource();
        for (templ in controlTemplates) {
            if (controlTemplates.hasOwnProperty(templ) &&
                ol.source[templ] &&
                layerSource instanceof ol.source[templ]) {
                return stache(controlTemplates[templ]);
            }
        }
        return stache(controlTemplates.default);
    }
});

export default Component.extend({
    tag: 'layer-control',
    viewModel: ViewModel,
    view: template,
    events: {
        inserted: function () {}
    }
});
