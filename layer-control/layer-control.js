import DefineMap from 'can-define/map/map';

import DefineList from 'can-define/list/list';
import Component from 'can-component';
import template from './layercontrol.stache!';
import stache from 'can-stache';
import ol from 'openlayers';
import './layercontrol.less!';

export const TEMPLATES = {
    'default': '<layer-control-default {layer}="." />',
    'Group': '<layer-control-group {layer}="." />',
    'TileWMS': '<layer-control-tilewms {layer}="." />'
};

var templ;
// precompile templates
for (templ in TEMPLATES) {
    if (TEMPLATES.hasOwnProperty(templ)) {
        TEMPLATES[templ] = stache(TEMPLATES[templ]);
    }
}

function getControlTemplate (layer) {
    for (templ in TEMPLATES) {
        if (TEMPLATES.hasOwnProperty(templ) &&
      ol.layer.hasOwnProperty(templ) &&
      layer instanceof ol.layer[templ]) {
            return TEMPLATES[templ];
        }
    }
    return TEMPLATES.default;
}

export const LayerMap = DefineMap.extend({
    exclude: 'boolean',
    title: 'string',
    visible: 'boolean',
    layer: '*',
    template: '*',
    init (layer) {
        this.set({
            exclude: layer.get('excludeControl'),
            title: layer.get('title') || 'Layer',
            visible: layer.getVisible(),
            layer: layer,
            template: getControlTemplate(layer)
        });
    }
});

export const LayerList = DefineList.extend({
    '#': LayerMap
});

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
        Type: LayerList,
        Value: LayerList
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
                const collection = map.getLayers();
                this.layers.replace(collection.getArray().reverse());

        //bind listeners for collection changes
                this._layerAddKey = collection.on('add', (event) => {
          //find the index of the added layer
                    collection.forEach((layer, index) => {
                        if (event.element === layer) {
              //we're creating a reversed array from that of the ol.collection
                            var newIndex = collection.getLength() - index - 1;
                            this.layers.splice(newIndex, 0, layer);
                        }
                    });
                });

                this._layerRemoveKey = collection.on('remove', (event) => {
                    this.removeLayerById(event.element.get('id'));
                });

            } else {
                this.layers.replace([]);
                ol.Observable.unByKey([this._layerAddKey, this._layerRemoveKey]);
            }


            return map;
        }
    },
    _layerAddKey: '*',
    _layerRemoveKey: '*',
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
    }
});

export default Component.extend({
    tag: 'layer-control',
    ViewModel: ViewModel,
    view: template,
    events: {
        inserted: function () {}
    }
});
