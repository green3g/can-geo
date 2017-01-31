import color from '../../util/color';
import DefineMap from 'can-define/map/map';
import ajax from 'can-util/dom/ajax/ajax';
import assign from 'can-util/js/assign/assign';
import param from 'can-util/js/param/param';
import ol from 'openlayers';
import dev from 'can-util/js/dev/dev';

function parseUrl (url) {
    const anchor = document.createElement('a');
    anchor.href = url;
    return anchor;
}

const encoders = {
    OSM (layer) {
        const source = layer.getSource();
        const parts = parseUrl(source.getUrls()[0]);
        const split = parts.pathname.split('.');
        const extension = split[split.length - 1];
        return {
            type: 'OSM',
            baseURL: 'http://c.tile.openstreetmap.org',
            extension: extension,
            tileSize: [256, 256],
            maxExtent: layer.getExtent() || [420000, 30000, 900000, 350000],
            resolutions: [156543.03, 78271.52, 39135.76]
        };
    },
    Vector (layer) {
        const source = layer.getSource();
        let style = layer.getStyle();
        if (typeof style === 'function') {
            style = style();
        }
        if (style instanceof Array) {
            style = style[0];
        }
        let fillColor = ol.color.asArray(style.getFill().getColor()).slice();

        const fillOpacity = fillColor.length === 4 ? fillColor[3] : 0;
        fillColor = color.rgbToHex(fillColor[0], fillColor[1], fillColor[2]);
        const geoJson = new ol.format.GeoJSON().writeFeaturesObject(source.getFeatures());

        return {
            type: 'vector',
            geoJson: geoJson,
            styles: {
                '': {
                    fillColor: fillColor,
                    strokeWidth: style.getStroke().getWidth(),
                    strokeColor: style.getStroke().getColor(),
                    fillOpacity: fillOpacity
                }
            }
        };
    },
    TileWMS (layer) {
        const source = layer.getSource();
        const params = source.getParams();
        const layers = params.LAYERS || params.layers;
        const url = parseUrl(source.getUrls()[0]);
        return {
            type: 'WMS',
            layers: layers.split(','),
            baseURL: url.protocol + '//' + url.hostname + url.pathname,
            format: params.FORMAT || params.format || 'image/png'
        };
    },
    ImageWMS (layer) {
        // eslint-disable-next-line new-cap
        return this.TileWMS(layer);
    }
};
/**
 * @constructor providers/print/MapfishPrint MapfishPrint
 * @parent providers/print/PrintProvider
 */
export default DefineMap.extend('MapfishProvider', {
    /**
     * The url to the mapfish print endpoint
     * @property {String} MapfishPrint.props.url
     * @parent MapfishPrint.props
     */
    url: 'string',
    /**
     * Whether or not to include legends. The default is `true`
     * @property {Boolean} MapfishPrint.props.legends
     * @parent MapfishPrint.props
     */
    legends: {
        type: 'boolean',
        value: true
    },
    /**
     * The url to a proxy if required
     * @property {String} MapfishPrint.props.proxy
     * @parent MapfishPrint.props
     */
    proxy: {
        type: 'string',
        value: null
    },
    /**
     * The method to use for printing. The default is `'POST'`
     * @property {String} MapfishPrint.props.method
     * @parent MapfishPrint.props
     */
    method: {
        type: 'string',
        value: 'POST'
    },
    /**
     * The default page printing settings. These settings
     * are heavily dependant on your print service.
     * The default is:
     * ```
     * layout: '8.5x11 Landscape',
     * dpi: 300,
     * mapTitle: 'Map Print'
     * ```
     * @property {Object} MapfishPrint.props.pageDefaults
     * @parent MapfishPrint.props
     */
    pageDefaults: {
        value: {
            layout: '8.5x11 Landscape',
            dpi: 300,
            mapTitle: 'Map Print'
        }
    },
    /**
     * The default print settings to use for the output print task.
     * The default is:
     * ```
     * outputFormat: 'pdf',
     * outputFilename: 'Print.pdf'
     * ```
     * @property {Object} MapfishPrint.props.printDefaults
     * @parent MapfishPrint.props

     */
    printDefaults: {
        value: {
            outputFormat: 'pdf',
            outputFilename: 'Print.pdf'
        }
    },
    /**
     * The default time to wait for the print service to complete
     * before timeout in milliseconds.
     * @property {Number} MapfishPrint.props.maxWait
     * @parent MapfishPrint.props
     */
    maxWait: {
        value: 10000,
        type: 'number'
    },
    /**
     * The default time to wait for the print service to complete
     * before timeout in milliseconds.
     * @property {Promise} MapfishPrint.props.promise
     * @parent MapfishPrint.props
     */
    promise: {
        value: null
    },
    timeout: {
        value: null
    },
    /**
     * @prototype
     */

    /**
     * Loads the print capabilities and returns a promise
     * resolved with the print data
     * @signature
     * @return {Promise} A promise resolved to the print data
     */
    loadCapabilities () {
        this.promise = new Promise((resolve, reject) => {
            ajax({
                url: this.url + '/info.json',
                dateType: 'json',
                method: 'GET'
            }).then((capabilities) => {
                resolve(capabilities);
            }).catch((error) => {
                dev.warn(error);
                reject(error);
            });
        });
        return this.promise;
    },
    /**
     * Generates a printout and returns a promise
     * which resolves to an object with a `url` and
     * `title` property.
     * @signature
     * @param  {Object} options The print out options.
     * @return {Promise} The promise that resolves to an object with
     * a `url` and `title` property. If the print fails, the `url` will be null, and instead an object with a `title` and `error` property will be returned
     */
    print (options) {
        this.promise = new Promise((resolve) => {
            const spec = JSON.stringify(this.getPrintObject(options));
            let url;
            if (this.method === 'GET') {
                url = this.url + '?spec=' + encodeURIComponent(spec);

                if (this.proxy) {
                    url = this.proxy + encodeURIComponent(url);
                }
                resolve({
                    url: url,
                    title: options.title
                });
            } else {
                url = this.url + '/create.json';
                if (this.proxy) {
                    url = this.proxy + encodeURIComponent(url);
                }
                ajax({
                    url: url,
                    data: spec,
                    contentType: 'application/json',
                    type: 'POST'
                }).then((results) => {
                    window.clearTimeout(this.timeout);
                    if (!results.getURL) {
                        resolve({
                            iconClass: 'fa fa-fw fa-exclamation',
                            url: null,
                            title: 'An error occurred',
                            error: 'No document was generated. A server error occurred.'
                        });
                        return;
                    }
                    const splitUrl = results.getURL.split('/');
                    const pdfUrl = this.url + '/' + splitUrl[splitUrl.length - 1];
                    resolve({
                        iconClass: 'fa fa-fw fa-file-pdf-o',
                        url: pdfUrl,
                        title: options.title
                    });
                }).catch((results) => {
                    window.clearTimeout(this.timeout);
                    dev.log(results);
                    resolve({
                        iconClass: 'fa fa-fw fa-exclamation',
                        url: null,
                        title: 'An error occurred',
                        error: results.responseText
                    });
                });
                this.timeout = setTimeout(() => {
                    resolve({
                        url: null,
                        title: 'Print timed out',
                        error: 'Print timed out'
                    });
                }, this.maxWait);
            }
        });
        return this.promise;
    },
    /**
     * Called internally to create a mapfish compliant print object
     * which can be converted into JSON and sent to the
     * mapfish server.
     * @signature
     * @param  {Object} options An object containing the print parameters (See `print` function)
     * @return {Object} A JSON serializable object that meets
     * the mapfish print spec.
     */
    getPrintObject: function (options) {
        //make sure the selected values are set
        const projection = options.map.getView().getProjection();
        const layers = options.map.getLayers();
        const self = this;
        let printLayers = [];
        layers.forEach(function (layer) {
            if (layer.getVisible()) {
                const lObjects = self.getLayerObjectRecursive(layer);
                if (lObjects.length) {
                    printLayers = printLayers.concat(lObjects);
                }
            }
        });
        return assign({
            layout: options.layout || this.defaults.layout,
            layers: printLayers,
            srs: projection.getCode(),
            units: projection.getUnits(),
            pages: [{
                // may be able to calculate the extent based
                // on the layout size of the map?
                // bbox: map.getView().calculateExtent([
                //   layout.map.width,
                //     layout.map.height,
                // ]),
                bbox: options.map.getView().calculateExtent(options.map.getSize()),
                // center: map.getView().getCenter(),
                scale: this.getMapScale(options.map),
                mapTitle: options.title,
                dpi: options.dpi
            }]
        }, this.getLegends(options.map));
    },
    /**
     * A helper function to parse layers while flattening group layers
     * @signature
     * @param  {ol.Layer} layer The layer to flatten and parse
     * @return {Object[]} The flattened array of mapfish print ready encoded layer objects
     */
    getLayerObjectRecursive: function (layer) {
        let layerObjects = [];
        if (layer instanceof ol.layer.Group) {
            const self = this;
            layer.getLayers().forEach(function (subLayer) {
                if (subLayer.getVisible()) {
                    layerObjects = layerObjects.concat(self.getLayerObjectRecursive(subLayer));
                }
            });
            return layerObjects;
        }
        for (const enc in encoders) {
            if (encoders.hasOwnProperty(enc)) {
                if (layer.getSource() instanceof ol.source[enc]) {
                    layerObjects.push(encoders[enc](layer));
                    break;
                }
            }
        }
        return layerObjects;
    },
    /**
     * A helper function to convert the map resolution to a scale
     * @signature
     * @param  {ol.Map} map The openlayers map
     * @return {Number} The map scale
     */
    getMapScale: function (map) {
        const resolution = map.getView().getResolution();
        const units = map.getView().getProjection().getUnits();
        const dpi = 25.4 / 0.28;
        const mpu = ol.proj.METERS_PER_UNIT[units];
        const scale = resolution * mpu * 39.37 * dpi;

        return scale;
    },
    /**
     * A helper function to generate urls to the layer legends
     * @signature
     * @param  {ol.Map} map The openlayers map
     * @return {object} An object consisting of the legend urls
     */
    getLegends: function (map) {
        if (!this.legends) {
            return {};
        }

        const legends = this.getLayerLegendsRecursive(map.getLayers());

        return {
            legends: legends
        };
    },
    /**
     * A helper function to flatten layer groups, create, parse, and return legend objects
     * @signature
     * @param  {ol.Collection} layers The layer collection array
     * @return {Array<legendObject>} The array of legend objects flattened
     */
    getLayerLegendsRecursive: function (layers) {
        let legends = [];
        const self = this;
        layers.forEach(function (layer) {
            if (!layer.getVisible() || layer.get('excludeLegend')) {
                return null;
            }
            if (layer instanceof ol.layer.Group) {
                legends = legends.concat(self.getLayerLegendsRecursive(layer.getLayers()));
                return legends;
            }
            const source = layer.getSource();
            if (source instanceof ol.source.TileWMS ||
                    source instanceof ol.source.ImageWMS) {

                const subLayers = source.getParams().LAYERS || source.getParams().layers;
                const legendObject = {
                    name: layer.get('title') || subLayers,
                    classes: []
                };

                    // defaults
                const legendParams = assign({
                    'SERVICE': 'WMS',
                    'REQUEST': 'GetLegendGraphic',
                    'WIDTH': 15,
                    'HEIGHT': 15,
                    'FORMAT': 'image/png'
                }, source.getParams());

                const singlelayers = subLayers.split(',');
                let url = parseUrl(source.getUrls()[0]);
                url = url.protocol + '//' + url.hostname + url.pathname + '?';
                    // If a WMS layer doesn't have multiple server layers, only show one graphic
                if (singlelayers.length === 1) {
                    legendParams.LAYER = singlelayers[0];
                    legendObject.icons = [url + param(legendParams)];
                } else {
                    for (let i = 0; i < singlelayers.length; i++) {
                        legendParams.LAYER = singlelayers[i];
                        legendObject.classes.push({
                            name: singlelayers[i],
                            icons: [url + param(legendParams)]
                        });
                    }
                }
                legends.push(legendObject);
            }
            return null;
        });
        return legends;
    }

});
