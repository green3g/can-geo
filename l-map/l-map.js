import Component from 'can-component';
import DefineMap from 'can-define/map/map';
import template from './lmap.stache';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import BasemapLayer from 'esri-leaflet/src/Layers/BasemapLayer';
// import batch from 'can-event/batch/batch';

function round (val) {
    return Math.round(val * 10000) / 10000;
}

export const ViewModel = DefineMap.extend('LMap', {seal: false}, {
    mapObject: '*',
    isAnimating: 'boolean',
    layers: {
        value () {
            return [
                new BasemapLayer('Topographic')
            ];
        }
    },
    x: {
        value: 37.75,
        set (x) {
            if (this.mapObject) {
                const coords = this.mapObject.getCenter();
                if (round(coords.lng) !== round(x)) {
                    this.mapObject.setView([this.y, x], this.zoom);
                }
            }
            return x;
        }
    },
    y: {
        value: -122.23,
        set (y) {
            if (this.mapObject) {
                const coords = this.mapObject.getCenter();
                if (round(coords.lat) !== round(y)) {
                    this.mapObject.setView([y, this.x], this.zoom);
                }
            }
            return y;
        }
    },
    zoom: {
        value: 10,
        set (z) {
            if (this.mapObject && z !== this.mapObject.getZoom()) {
                this.mapObject.setZoom(z);
            }
            return z;
        }
    },
    createMap (element) {
        if (this.mapObject) {
            return;
        }
        this.mapObject = L.map(element).setView([this.y, this.x], this.zoom);
        this.layers.forEach((l) => {
            this.mapObject.addLayer(l);
        });

        this.mapObject.on('moveend', () => {
            const coords = this.mapObject.getCenter();

            this.set({
                x: coords.lng,
                y: coords.lat
            });
        });
        this.mapObject.on('zoomend', () => {
            this.zoom = this.mapObject.getZoom();
        });
    },
    destroyMap () {
        if (this.mapObject) {
            this.mapObject.remove();
            this.mapObject = null;
        }
    }
});

export default Component.extend({
    tag: 'l-map',
    ViewModel: ViewModel,
    view: template,
    events: {
        inserted (element) {
            this.viewModel.createMap(element);
        },
        beforeremove () {
            this.viewModel.destroyMap();
        }
        // '{viewModel} x': function () {
        //     this.viewModel.changeViewAsync();
        // },
        // '{viewModel} y': function () {
        //     this.viewModel.changeViewAsync();
        // },
        // '{viewModel} zoom': function () {
        //     this.viewModel.changeViewAsync();
        // }
    }
});
