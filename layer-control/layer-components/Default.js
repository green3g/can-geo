
import DefaultTemplate from './Default.stache!';
import DefineMap from 'can-define/map/map';
import Component from 'can-component';

export const DefaultViewModel = DefineMap.extend('DefaultLayer', {
    visible: 'boolean',
    title: 'string',
    init: function () {
        const layer = this.layer.layer;
        this.visible = layer.getVisible();
        layer.on('change:visible', this.updateVisible.bind(this));
    },
    toggleVisible: function () {
        this.layer.layer.setVisible(!this.visible);
    },
    updateVisible: function (e) {
        this.visible = e.target.getVisible();
    }
});

Component.extend({
    tag: 'layer-control-default',
    viewModel: DefaultViewModel,
    view: DefaultTemplate
});

export default DefaultViewModel;
