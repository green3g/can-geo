import {ViewModel as Popup, OlPopup} from '../ol-popup/ol-popup';
import './identify-widget';
import ol from 'openlayers';
import template from './identify-popup.stache';

/**
 * @constructor identify-popup.ViewModel ViewModel
 * @extends ol-popup.ViewModel
 * @parent identify-popup
 * @group identify-popup.ViewModel.props Properties
 *
 * @description A `<identify-popup />` component's ViewModel
 */
export const ViewModel = Popup.extend('IdentifyPopup', {
    /**
     * The currently active feature in the identify widget
     * When this feature object is set, the map and popup are centered
     * on the feature's center.
     * @property {Object}
     */
    activeFeature: {
        type: '*',
        set (feature) {
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

/**
 * @module {can.Component} identify-popup
 * @parent geo.components
 * @extends ol-popup
 */
export const IdentifyPopup = OlPopup.extend({
    tag: 'identify-popup',
    ViewModel: ViewModel,
    view: template
});
