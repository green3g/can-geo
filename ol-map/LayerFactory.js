import ol from 'openlayers';
import assign from 'can-util/js/assign/assign';
import DefineList from 'can-define/list/list';
const layerClass = {
    TileWMS: 'Tile',
    Group: 'Group',
    OSM: 'Tile',
    ImageWMS: 'Image',
    ImageVector: 'Image',
    Vector: 'Vector'
};

let currentId = 0;

function convertToObject (obj) {
    if (obj.serialize) {
        return obj.serialize();
    }
    return obj;
}

export default {
    getLayer (options) {
        options = convertToObject(options);
      //if user provides the actual layer, skip the layer factory
        if (options instanceof ol.layer.Base) {
            return options;
        }
      //get the layer class name
      //different from our short name
      //For example, layer type TileWMS and ImageWMS both use type 'Tile'
        const type = layerClass[options.type];

      //the user custom constructor options
        const userOptions = options.options ? options.options : {};

      //the required parameters for the layer
        const requiredOptions = this[options.type](options);

      //make sure the layer has a unique id
        if (!userOptions.id) {
            userOptions.id = 'layer-' + currentId ++;
        }

      //mixin all of our configuration options for the constructor
        return new ol.layer[type](assign(userOptions, requiredOptions));
    },
    ImageWMS (options) {
        return {
            source: new ol.source.ImageWMS(options.sourceOptions)
        };
    },
    ImageVector (options) {
        return {
            source: new ol.source.ImageVector(options.sourceOptions)
        };
    },
    TileWMS (options) {
        return {
            source: new ol.source.TileWMS(options.sourceOptions)
        };
    },
    Group (options) {
        const layers = new DefineList(options.options.layers)
        .reverse()
        .map(this.getLayer.bind(this));
        return {
            layers: new ol.Collection(layers)
        };
    },
    OSM (options) {
        const sourceOptions = options.sourceOptions ? options.sourceOptions : {};
        return {
            source: new ol.source.OSM(sourceOptions)
        };
    },
    Vector (options) {
        const sourceOptions = options.sourceOptions ? options.sourceOptions : {};
        return {
            source: new ol.source.Vector(sourceOptions)
        };
    }
};
