
import Component from 'can-component';
import CanEvent from 'can-event';
import DefineMap from 'can-define/map/map';
import assign from 'can-util/js/assign/assign';
import canViewModel from 'can-view-model';
import ol from 'openlayers';
import 'spectre-canjs/modal-dialog/';
import template from './olPopup.stache!';
import './olPopup.less!';

/**
 * @constructor ol-popup.ViewModel ViewModel
 * @parent ol-popup
 * @group ol-popup.ViewModel.props Properties
 *
 * @description A `<ol-popup />` component's ViewModel
 */
export const ViewModel = DefineMap.extend({
  /**
   * @prototype
   */
    /**
     * Whether or not the current state of this popup should be a modal dialog instead of a map overlay popup. This can be changed dynamically
     * @property {Boolean} ol-popup.ViewModel.props.modal
     * @parent ol-popup.ViewModel.props
     */
    modal: {
        type: 'htmlbool',
        value: false
    },
    modalActive: 'boolean',
    x: {
        type: 'number',
        set (x) {
            if (typeof x === 'undefined') {
                this.hidePopup();
            } else {
                this.showPopupAsync();
            }
            return x;
        }
    },
    y: {
        type: 'number',
        set (y) {
            if (typeof y === 'undefined') {
                this.hidePopup();
            } else {
                this.showPopupAsync();
            }
            return y;
        }
    },
    active: {
        type: 'htmlbool',
        set (active) {
            if (!active) {
                this.hidePopup();
            }
            return active;
        }
    },
    overlay: '*',
    overlayElement: {
        type: '*',
        set (element) {
            this.overlay = new ol.Overlay({
                element: element,
                autoPan: true,
                autoPanAnimation: {
                    duration: 250
                }
            });
            return element;
        }
    },
    map: {
        type: '*',
        set (map) {
            if (!map) {
                return map;
            }
            if (this.overlay && map.getOverlays().getArray().indexOf(this.overlay) === -1) {
                map.addOverlay(this.overlay);
            }
            map.on('click', (event) => {
                // this.showPopup(event.coordinate);
                this.set({
                    x: event.coordinate[0],
                    y: event.coordinate[1]
                });
            });
            return map;
        }
    },
    isSettingAsync: 'boolean',
  /**
   * @typedef {can.Event} ol-popup.events.popupShow show
   * An event dispatched when the popup is shown
   * @parent ol-popup.events
   * @option {Array<Number>} coordinate The coordinate in which the popup is shown
   */
  /**
   * Displays and centers this popup on a coordinate, and dispatches the `show` event
   * @param  {Array<Number>} coordinate The x,y pair to center the popup on
   */
    showPopup (coordinate) {
        if (!this.active) {
            return;
        }
        if (!this.modal) {
            this.overlay.setPosition(coordinate);
        } else {
            this.modalActive = true;
        }
        this.dispatch('show', [coordinate]);
    },
    showPopupAsync (coordinate) {
        return new Promise((resolve) => {
            if (!this.isSettingAsync) {
                this.isSettingAsync = true;
                setTimeout(() => {
                    if (!coordinate) {
                        coordinate = [this.x, this.y];
                    }
                    this.showPopup(coordinate);
                    this.isSettingAsync = false;
                    resolve(true);
                });
            } else {
                resolve(false);
            }

        });
    },
    hidePopup () {
        this.overlay.setPosition(undefined);
        this.modalActive = false;
    }
});

assign(ViewModel.prototype, CanEvent);

/**
 * @module {can.Component} ol-popup <ol-popup />
 * @parent geo.components
 */
export const OlPopup = Component.extend({
    tag: 'ol-popup',
    view: template,
    ViewModel: ViewModel,
    leakScope: true,
    events: {
        inserted () {
            var mapViewModel = canViewModel(this.element.parentNode);
            this.viewModel.overlayElement = this.element.querySelector('.ol-popup');
            this.viewModel.map = mapViewModel.mapObject;
        },
        removed () {
            if (this.viewModel.overlay && this.viewModel.map) {
                this.viewModel.map.removeOverlay(this.overlay);
            }
        }
    }
});
