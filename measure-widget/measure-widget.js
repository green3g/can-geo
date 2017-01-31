import DefineMap from 'can-define/map/map';
import DefineList from 'can-define/list/list';
import assign from 'can-util/js/assign/assign';
import Component from 'can-component';

import template from './measure.stache!';
import './measure.css!';

import ol from 'openlayers';
import measurements from './modules/measurements';
import conversion from './modules/conversion';
import helpOverlayTemplate from './templates/helpOverlay.stache!';
import measureOverlayTemplate from './templates/measureOverlay.stache!';
/**
 * @constructor measure-widget.ViewModel ViewModel
 * @parent measure-widget
 * @group measure-widget.ViewModel.props Properties
 *
 * @description A `<measure-widget />` component's ViewModel
 */
export const ViewModel = DefineMap.extend('MeasureWidget', {
    /**
     * An array of measurement objects to use. These are configureable in `./modules/measurements`
     * @property {Array<measurementObjects>} measure-widget.ViewModel.props.measurements
     * @parent measure-widget.ViewModel.props
     */
    measurements: {
        value: measurements
    },
    /**
     * The current state of the widget. This is set to true when a button is activated
     * @property {Boolean} measure-widget.ViewModel.props.active
     * @parent measure-widget.ViewModel.props
     */
    active: {
        Type: DefineMap,
        set (active) {
            if (!active) {
                this.removeMapHover();
                if (this.interaction) {
                    this.map.removeInteraction(this.interaction);
                    this.interaction = null;
                }
                this.dispatch('deactivate');
                return active;
            }
            if (this.interaction) {
                this.map.removeInteraction(this.interaction);
            }
            //add the help tooltip listener
            this.addMapHover();
            //add the interaction for measuring
            this.interaction = this.getInteraction(active.type);
            this.map.addInteraction(this.interaction);
            this.dispatch('activate');
            return active;
        }

    },
    /**
     * The current value in the units dropdown
     * @property {String} measure-widget.ViewModel.props.unitsDropdown
     * @parent measure-widget.ViewModel.props
     */
    unitsDropdown: {
        value: '',
        type: 'string'
    },
    /**
     * Should labels be added to the map drawings by default
     * @property {Boolean} measure-widget.ViewModel.props.addLabels
     * @parent measure-widget.ViewModel.props
     */
    addLabels: {
        value: true,
        type: 'boolean'
    },
    vectorLayer: '*',
    helpOverlay: '*',
    measureOverlay: '*',
    measureOverlays: {
        Type: DefineList,
        Value: DefineList
    },
    measureValue: '*',
    interaction: '*',
    pointerMoveKey: '*',
    activeUnits: {
        get () {
            if (!this.unitsDropdown) {
                return null;
            }
            return this.active.units.filter((u) => {
                return u.value === this.unitsDropdown;
            })[0];
        }
    },
    map: {
        type: '*',
        set (map) {
            if (!map) {
                return map;
            }

            this.initVectorLayer(map);
            this.initHelpOverlay(map);

            return map;
        }
    },
    /**
     * This is the function called when a tool button is clicked. Activates a measure tool if is not already active. If it is already active, it deactivates the measure tool.
     * @prototype
     * @signature
     * @param  {measureToolObject} measureTool The tool to activate
     */
    activateMeasureTool (measureTool) {
        if (this.active === measureTool) {
            this.active = null;
        } else {
            this.active = measureTool;
            this.unitsDropdown = this.active.units[0].value;
        }
    },
    /**
     * Calls methods to clear the overlay layers
     * @signature
     */
    clearMeasurements () {
        this.clearMeasureOverlays();
    },
    changeUnits (key) {
        this.active.units.forEach((unit) => {
            if (unit.value === key) {
                this.activeUnits = unit;
            }
        });
    },
    addMapHover () {
        if (!this.pointerMoveKey) {
            this.pointerMoveKey = this.map.on('pointermove', this.pointerMove.bind(this));
        }
    },
    removeMapHover () {
        if (this.pointerMoveKey) {
            this.map.unByKey(this.pointerMoveKey);
            this.pointerMoveKey = null;
        }
        this.helpOverlay.setPosition(undefined);
    },
    getInteraction (type) {
        const interaction = new ol.interaction.Draw({
            source: this.vectorLayer.getSource(),
            type: type,
            style: new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.2)'
                }),
                stroke: new ol.style.Stroke({
                    color: 'rgba(0, 0, 0, 0.5)',
                    lineDash: [10, 10],
                    width: 2
                }),
                image: new ol.style.Circle({
                    radius: 5,
                    stroke: new ol.style.Stroke({
                        color: 'rgba(0, 0, 0, 0.7)'
                    }),
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    })
                })
            })
        });
        interaction.on('drawstart', this.drawStart.bind(this));
        interaction.on('drawend', this.drawEnd.bind(this));
        return interaction;
    },
    initVectorLayer (map) {
        const vectorSource = new ol.source.Vector();
        this.vectorLayer = new ol.layer.Vector({
            title: 'Measurements',
            id: 'measure' + this.instanceId,
            source: vectorSource,
            style: new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(14,138,231, 0.2)'
                }),
                stroke: new ol.style.Stroke({
                    color: '#0e8ae7',
                    width: 2
                }),
                image: new ol.style.Circle({
                    radius: 7,
                    fill: new ol.style.Fill({
                        color: '#0e8ae7'
                    })
                })
            })
        });
        map.addLayer(this.vectorLayer);
    },
    initHelpOverlay (map) {
        const node = map.getViewport();
        window.node = node;
        const frag = helpOverlayTemplate(this);
        const helpNode = node.appendChild(frag.firstChild);
        this.helpOverlay = new ol.Overlay({
            element: helpNode,
            offset: [15, 0],
            positioning: 'center-left'
        });
        map.addOverlay(this.helpOverlay);
    },
    createMeasureOverlay (attributes) {
        const node = this.map.getViewport();
        const frag = measureOverlayTemplate(attributes);
        const measureNode = node.appendChild(frag.firstChild);

        return new ol.Overlay({
            element: measureNode,
            offset: [-15, 0],
            positioning: 'bottom-center'
        });
    },
    clearMeasureOverlays () {
        this.measureOverlays.forEach((o) => {
            const element = o.getElement();
            this.map.removeOverlay(o);
            element.parentNode.removeChild(element);
        });
        this.measureOverlays.replace([]);
        this.vectorLayer.getSource().clear();
    },
    pointerMove (evt) {
        if (evt.dragging) {
            return;
        }
        this.helpOverlay.setPosition(evt.coordinate);
    },
    drawStart (evt) {
        this.measureOverlay = this.createMeasureOverlay(this);
        this.map.addOverlay(this.measureOverlay);
        evt.feature.set('name', 'Measurement');
        const geom = evt.feature.getGeometry();
        if (geom instanceof ol.geom.Point) {
            this.measureOverlay.setPosition(geom.getLastCoordinate());
            this.measureValue = conversion.getPosition(geom,
                this.map.getView().getProjection(),
                this.activeUnits.value
            );
            this.drawEnd(evt);
            return;
        }
        let coords = evt.coordinate,
            value;
        geom.on('change', (e) => {
            const geomChg = e.target;
            if (geomChg instanceof ol.geom.Polygon) {
                coords = geomChg.getInteriorPoint().getCoordinates();
                value = conversion.getArea(geomChg, this.map.getView().getProjection(),
                    this.activeUnits.value, this.useGeodisic);
            } else if (geomChg instanceof ol.geom.LineString) {
                coords = geomChg.getLastCoordinate();
                value = conversion.getLength(geomChg, this.map.getView().getProjection(),
                    this.activeUnits.value, this.useGeodisic);
            }
            this.measureOverlay.setPosition(coords);
            this.measureValue = value;
        });
    },
    drawEnd () {
        const coords = this.measureOverlay.getPosition();
        this.measureOverlay.setPosition(undefined);
        if (this.addLabels) {
            const tooltip = this.createMeasureOverlay({
                activeUnits: assign({}, this.activeUnits),
                measureValue: this.measureValue,
                cssClass: ' measure-tooltip-static'
            });
            tooltip.setOffset([0, -7]);
            this.map.addOverlay(tooltip);
            tooltip.setPosition(coords);
            this.measureOverlays.push(tooltip);
        }
    }
});

export default Component.extend({
    tag: 'measure-widget',
    view: template,
    viewModel: ViewModel
});
