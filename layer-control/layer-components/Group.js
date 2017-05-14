import {ViewModel as baseViewModel} from '../layer-control';
import template from './Group.stache!';
import Component from 'can-component';

export const ViewModel = baseViewModel.extend({
    visible: {
        type: 'boolean'
    },
    collapsed: {
        type: 'boolean',
        value: true
    },
    radioGroup: {
        type: 'boolean',
        value: false
    },
    layer: {
        type: '*',
        set (layer) {
            // initialize properties from the layer
            this.set({
                visible: layer.layer.getVisible(),
                collapsed: !(layer.layer.get('collapsed') === false),
                radioGroup: layer.layer.get('radioGroup')
            });
            this.layers.replace(layer.layer.getLayers().getArray());

            // set radio group 'basemap' visibility
            if (this.radioGroup) {
                const visibleLayers = [];
                this.layers.forEach((l) => {
                    if (l.visible) {
                        visibleLayers.push(l);
                    }
                });

                //check for no visible layers and set the first one visible
                if (visibleLayers.length === 0) {
                    this.setRadioVisible(this.layers[0]);

                //check for multiple visible layers and set the first one visible
                } else if (visibleLayers.length > 1) {
                    visibleLayers.forEach((l, index) => {
                        if (index) {
                            this.setRadioVisible(l);
                        }
                    });
                }
            }
            return layer;
        }
    },
    toggleVisible: function () {
        this.layer.layer.setVisible(!this.visible);
        this.visible = !this.visible;
    },
    toggleCollapsed: function () {
        this.collapsed = !this.collapsed;
    },
    setRadioVisible: function (selectedLayer) {
        this.layers.forEach((layer) => {
            const visible = selectedLayer.layer.get('id') === layer.layer.get('id');
            layer.layer.setVisible(visible);
            layer.visible = visible;
        });
    }
});

Component.extend({
    tag: 'layer-control-group',
    ViewModel: ViewModel,
    view: template
});
