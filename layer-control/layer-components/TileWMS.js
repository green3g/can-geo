import Component from 'can-component';
import baseViewModel from './Default';
import template from './TileWMS.stache!';
import DefineList from 'can-define/list/list';
import DefineMap from 'can-define/map/map';
import './TileWMS.less';

import dev from 'can-util/js/dev/dev';

const SubLayerMap = DefineMap.extend({
    layer: '*',
    title: {
        type: 'string',
        get (title) {
            if (!title) {
                return this.id;
            }
            return title;
        }
    },
    id: 'string',
    visible: 'boolean',
    collapsed: {
        type: 'boolean',
        value: true
    },
    baseUrl: 'string',
    legendGraphicURL: {
        get () {
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
    },
    toggleCollapsed: function (sub) {
        sub.collapsed = !sub.collapsed;
    }
});

export const SubLayerList = DefineList.extend({
    '#': SubLayerMap
});

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
        Value: SubLayerList,
        Type: SubLayerList
    },
    init: function () {
        baseViewModel.prototype.init.apply(this, arguments);
        const source = this.layer.layer.getSource();
        const params = source.getParams();
        const sublayers = (params.LAYERS || params.layers).split(',');
        const defaultVisible = this.defaultSublayerVisible;
        this.sublayers = sublayers.map((sublayer) => {
            return {
                //title: TODO get a configureable title
                id: sublayer,
                visible: defaultVisible,
                baseUrl: source.getUrls()[0]
            };
        });

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
