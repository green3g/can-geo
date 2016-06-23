import ol from 'openlayers';
import can from 'can';

var layerClass = {
  TileWMS: 'Tile',
  Group: 'Group',
  OSM: 'Tile',
  ImageWMS: 'Image',
  ImageVector: 'Image'
};

var currentId = 0;
var getNextId = function() {
  return currentId++;
};

function convertToObject(obj) {
  if (obj.attr) {
    return obj.attr();
  }
  return obj;
}

export default {
  getLayer(options) {
      options = convertToObject(options);
      //if user provides the actual layer, skip the layer factory
      if (options instanceof ol.layer.Base) {
        return options;
      }
      //get the layer class name
      //different from our short name
      //For example, layer type TileWMS and OSM both use type 'Tile'
      var type = layerClass[options.type];

      //the user custom constructor options
      var userOptions = options.options ? options.options : {};

      //the required parameters for the layer
      var requiredOptions = this[options.type](options);

      //make sure the layer has a unique id
      if (!userOptions.id) {
        userOptions.id = 'layer-' + getNextId();
      }

      //mixin all of our configuration options for the constructor
      return new ol.layer[type](can.extend(userOptions, requiredOptions));
    },
    ImageWMS(options) {
      return {
        source: new ol.source.ImageWMS(options.sourceOptions)
      };
    },
    ImageVector(options) {
      return {
        source: new ol.source.ImageVector(options.sourceOptions)
      };
    },
    TileWMS(options) {
      return {
        source: new ol.source.TileWMS(options.sourceOptions)
      };
    },
    Group(options) {
      let layers = new List(options.options.layers)
        .reverse()
        .map(this.getLayer.bind(this));
      return {
        layers: new ol.Collection(layers)
      };
    },
    OSM(options) {
      var sourceOptions = options.sourceOptions ? options.sourceOptions : {};
      return {
        source: new ol.source.OSM(sourceOptions)
      };
    }
};
