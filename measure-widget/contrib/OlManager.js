import ol from 'openlayers';
import conversion from './conversion';
import helpOverlayTemplate from './helpOverlay.stache!';
import measureOverlayTemplate from './measureOverlay.stache!';
import DefineMap from 'can-define/map/map';
import assign from 'can-util/js/assign/assign';
/**
 * @module OlManager
 * A measure overlay manager for openlayers 3 maps
 */
export default DefineMap.extend('OpenlayersManager', {
    helpMessage: '*',
    useGeodisic: {value: true, type: 'boolean'},
    measureOverlays: {
        value () {
            return [];
        }
    },
    map: {
        type: '*',
        set (map, set) {
            set(map);
            this.initVectorLayer();
            this.initHelpOverlay();
            this.initMeasureOverlay();
        }
    },
    initVectorLayer () {
        var vectorSource = new ol.source.Vector();
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
        this.map.addLayer(this.vectorLayer);
    },
    activate (measure) {
        this.activeMeasurement = measure;
        if (this.interaction) {
            this.map.removeInteraction(this.interaction);
        }
        //add the help tooltip listener
        this.addMapHover();
        //add the interaction for measuring
        this.interaction = this.getInteraction(measure.type);
        this.map.addInteraction(this.interaction);
    },
    deactivate () {
        this.removeMapHover();
        if (this.interaction) {
            this.map.removeInteraction(this.interaction);
            this.interaction = null;
        }
    },
    changeUnits (key) {
        this.activeMeasurement.units.forEach((unit) => {
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
        var interaction = new ol.interaction.Draw({
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
    initHelpOverlay () {
        var node = this.map.getViewport();
        var frag = helpOverlayTemplate(this);
        var helpNode = node.appendChild(frag.firstChild);
        this.helpOverlay = new ol.Overlay({
            element: helpNode,
            offset: [15, 0],
            positioning: 'center-left'
        });
        this.map.addOverlay(this.helpOverlay);
    },
    initMeasureOverlay () {
        this.measureOverlay = this.createMeasureOverlay(this);
        this.map.addOverlay(this.measureOverlay);
    },
    createMeasureOverlay (attributes) {
        var node = this.map.getViewport();
        var frag = measureOverlayTemplate(attributes);
        var measureNode = node.appendChild(frag.firstChild);

        return new ol.Overlay({
            element: measureNode,
            offset: [-15, 0],
            positioning: 'bottom-center'
        });
    },
    clearMeasureOverlays () {
        this.measureOverlays.forEach((o) => {
            var element = o.getElement();
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
        evt.feature.set('name', 'Measurement');
        var geom = evt.feature.getGeometry();
        if (geom instanceof ol.geom.Point) {
            this.measureOverlay.setPosition(geom.getLastCoordinate());
            this.measureValue = conversion.getPosition(geom,
              this.map.getView().getProjection(),
              this.activeUnits.value
            );
            this.drawEnd(evt);
            return;
        }
        var coords = evt.coordinate,
            value;
        geom.on('change', (e) => {
            var geom = e.target;
            if (geom instanceof ol.geom.Polygon) {
                coords = geom.getInteriorPoint().getCoordinates();
                value = conversion.getArea(geom, this.map.getView().getProjection(),
          this.activeUnits.value, this.useGeodisic);
            } else if (geom instanceof ol.geom.LineString) {
                coords = geom.getLastCoordinate();
                value = conversion.getLength(geom, this.map.getView().getProjection(),
                  this.activeUnits.value, this.useGeodisic);
            }
            this.measureOverlay.setPosition(coords);
            this.measureValue = value;
        });
    },
    drawEnd () {
        var coords = this.measureOverlay.getPosition();
        this.measureOverlay.setPosition(undefined);
        if (this.addLabels) {
            var tooltip = this.createMeasureOverlay({
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
