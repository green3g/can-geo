import Component from 'can-component';
import baseViewModel from './Default';
import template from './TileWMS.stache!';
import DefineList from 'can-define/list/list';

import dev from 'can-util/js/dev/dev';

const ViewModel = baseViewModel.extend({
    collapsed: {
        type: 'boolean',
        value: true
    },
    defaultSublayerVisible: {
        type: 'boolean',
        value: true
    },
    sublayers: {
        Value: DefineList
    },
    init: function () {
        baseViewModel.prototype.init.apply(this, arguments);
        const source = this.layer.layer.getSource();
        const params = source.getParams();
        this.sublayers = (params.LAYERS || params.layers).split(',');
        const sublayerObjects = [];
        const defaultVisible = this.defaultSublayerVisible;
        this.sublayers.forEach((sublayer) => {
            sublayerObjects.push({
                title: sublayer, //TODO: make configureable title options
                id: sublayer,
                visible: defaultVisible,
                collapsed: true,
                baseUrl: source.getUrls()[0],
                toggleCollapsed: function (sub) {
                    sub.collapsed = !sub.collapsed;
                },
                getLegendGraphicURL () {
                    let separator;
                    if (this.baseUrl.indexOf('?') > -1) {
                        separator = '';
                    } else {
                        separator = '?';
                    }
                    return [
                        this.baseUrl,
                        separator,
                        'REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=40&LAYER=',
                        this.id
                    ].join('');
                }
            });
        });
        this.sublayers = sublayerObjects;
        this.updateSublayerVisibility();
    },
    toggleCollapsed: function () {
        this.collapsed = !this.collapsed;
    },
    setSublayerVisibility: function (sublayer) {
        const visible = sublayer.visible;
        sublayer.visible = !visible;
        this.updateSublayerVisibility();
    },
    updateSublayerVisibility () {
        const source = this.layer.layer.getSource();
        const newLayersParam = this.sublayers.filter((s) => {
            return s.visible;
        }).map(function (s) {
            return s.id;
        }).join(',');
        if (!newLayersParam) {
            dev.warn('No layers are visible, wms server may not respond correctly');
        }
        source.updateParams({
            LAYERS: newLayersParam
        });
    }
});

Component.extend({
    tag: 'layer-control-tilewms',
    ViewModel: ViewModel,
    view: template
});
