import {ViewModel as Popup} from '../ol-popup/ol-popup';
import './identify-widget';
import ol from 'openlayers';
import template from './identify-popup.stache';
import Component from 'can-component';
import canViewModel from 'can-view-model';

export const ViewModel = Popup.extend({
    activeFeature: {
        type: '*',
        set (feature) {
            console.log(this.overlay, feature);
            if (!this.overlay) {
                return feature;
            }
            if (!feature) {
                this.showPopup(undefined);
            } else {
                const extent = feature.feature.getGeometry().getExtent();
                const center = ol.extent.getCenter(extent);
                this.showPopup(center);
            }
            return feature;
        }
    }
});

export const IdentifyPopup = Component.extend({
    tag: 'identify-popup',
    viewModel: ViewModel,
    view: template,
    events: {
        inserted () {
            var mapViewModel = canViewModel(this.element.parentNode);
            this.viewModel.set({
                overlayElement: this.element.querySelector('.ol-popup'),
                map: mapViewModel.mapObject
            });
        },
        removed () {
        }
    }
});
