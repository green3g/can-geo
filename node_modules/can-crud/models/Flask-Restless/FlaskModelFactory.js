/* jshint esnext:true */
import List from 'can/list/';
import CanMap from 'can/map/';
import connect from 'can-connect';

// import superMap from 'can-connect/can/super-map/';
import can from 'can/util/library';
import set from 'can-set';
import { ParameterMap } from './FlaskRestlessParameters';
import 'can-connect/constructor/';
import 'can-connect/can/map/';
import 'can-connect/constructor/store/';

import 'can-connect/data/callbacks/';
import 'can-connect/data/callbacks-cache/';
import 'can-connect/data/inline-cache/';

import 'can-connect/data/parse/';
import 'can-connect/data/url/';
import 'can-connect/data/localstorage-cache/';
import 'can-connect/real-time/';
import 'can-connect/fall-through-cache/';
import 'can-connect/constructor/callbacks-once/';
/**
 * @typedef {connectInfoObject} apiProvider.types.connectInfoObject ConnectInfoObject
 * @parent apiProvider.types
 * @option {Number} totalItems The total number of items available through this api
 * @option {can.Map} relationships Keys that represent field names where relationships exist. Each key's value in this object is set to `true` to keep track of which fields are relationships.
 */
const PropertiesObject = CanMap.extend({
  define: {
    totalItems: {
      type: 'number',
      value: 0
    },
    relationships: {
      Value: CanMap
    }
  }
});

/**
 * @typedef {FlaskConnectOptions} apiProvider.types.FlaskConnectOptions FlaskConnectOptions
 * @parent apiProvider.types
 * @option {can.Map} map The template object to use when creating new objects. This
 * map can supply default values, getters and setters, and types of properties on an object
 * @option {String} idProp The proerty to use for the id
 * @option {String} name The name of the connection to use. This should be unique across the application, and should reference
 * the data type that flask-restless is serving. Flask Restless defaults to using the tablename as the data type name
 * @option {String} url The url to the Flask-Restless resource
 */

/**
 *
 * A factory function that creates a new Flask-Restless API connection.
 * @parent apiProvider.providers
 * @param {apiProvider.types.FlaskConnectOptions} options The factory options
 * @return {can-connect/can/super-map}
 */
export function FlaskConnectFactory(options) {
  //a new list which should hold the objects
  let Objectist = List.extend({
    Map: options.map
  });
  let properties = new PropertiesObject();
  let idProp = options.idProp || 'id';

  //create a flask-restless set algebra
  let algebra = new set.Algebra({
      'filter[objects]': function() {
        console.log(arguments);
        return true;
      }
    },
    //unique id
    set.comparators.id(idProp),
    //pagination
    set.comparators.rangeInclusive('page[number]'),
    //sorting
    set.comparators.sort('sort')
  );


    //create a local storage connection
    let cacheConnection = connect(['data-localstorage-cache'], {
      name: options.name
    });

  //create and return a new supermap
  return connect(['constructor', 'can-map', 'constructor-store',
  'data-callbacks', 'data-callbacks-cache', 'data-inline-cache',
  'data-parse', 'data-url', 'real-time', 'fall-through-cache',
  'constructor-callbacks-once'], {
    cacheConnection: cacheConnection,
    idProp: idProp,
    algebra: algebra,
    baseURL: options.url,
    metadata: properties,
    Map: options.map,
    List: options.map.List,
    name: options.name,
    url: {
      resource: options.url,
      //getData params
      // {
      //  filter: filter[objects]= + JSON.stringify(filterObjects[])
      //  group:  'group=' + fieldName
      // }
      // getData: 'GET ' + options.url,
      getListData: function(params) {
        params = new ParameterMap(params);
        var def = can.ajax({
          url: this.resource,
          headers: {
            'Accept': 'application/vnd.api+json'
          },
          method: 'GET',
          data: params.serialize()
        });
        def.then(function(props) {
          //cache the raw data for future use
          properties.attr('totalItems', props.meta.total);
        });
        return def;
      },
      getData: function(params) {
        var def = can.ajax({
          url: this.resource + '/' + params[idProp],
          headers: {
            'Accept': 'application/vnd.api+json'
          },
          method: 'GET'
        });
        return def;
      },
      createData: function(attrs) {

        var data = {};
        //exclude relationship properties
        for (var a in attrs) {
          if (attrs.hasOwnProperty(a) && !properties.attr('relationships.' + a)) {
            data[a] = attrs[a];
          }
        }

        //post attributes to the create url
        return can.ajax({
          url: this.resource,
          headers: {
            'Accept': 'application/vnd.api+json',
            'Content-Type': 'application/vnd.api+json'
          },
          data: JSON.stringify({
            data: {
              attributes: data,
              type: options.name
            }
          }),
          method: 'POST'
        });
      },
      updateData: function(attrs) {
        var data = {};
        //exclude relationship properties
        for (var a in attrs) {
          if (attrs.hasOwnProperty(a) && !properties.attr('relationships.' + a)) {
            data[a] = attrs[a];
          }
        }
        return can.ajax({
          url: this.resource + '/' + attrs[idProp],
          headers: {
            'Accept': 'application/vnd.api+json',
            'Content-Type': 'application/vnd.api+json'
          },
          data: JSON.stringify({
            data: {
              attributes: data,
              type: options.name,
              id: attrs[idProp]
            }
          }),
          method: 'PATCH'
        });
      },
      destroyData: function(attrs) {
        return can.ajax({
          url: this.resource + '/' + attrs[idProp],
          headers: {
            'Accept': 'application/vnd.api+json',
            'Content-Type': 'application/vnd.api+json'
          },
          method: 'DELETE'
        });
      }
    },
    parseListProp: 'data',
    parseInstanceData: function(props) {
      //if for some reason we don't have an object, return
      if (!props) {
        return {};
      }
      //sometimes props are actually in the data property
      //could be a bug with flask-restless
      if (props.data) {
        props = props.data;
      }
      //build a new object that consists of a combination of the FlaskRestless
      //response object
      var obj = props.attributes;
      obj.id = props[this.idProp];
      //include the relationship id's
      can.batch.start();
      for (var rel in props.relationships) {
        if (props.relationships.hasOwnProperty(rel) &&
          props.relationships[rel].hasOwnProperty('data')) {
          //if its an array, extract an array of the ids
          obj[rel] = Array.isArray(props.relationships[rel].data) ?
            props.relationships[rel].data.map(item => {
              return item.id;
            }) :
            //otherwise return the id of the item or null if the proprty is not set
            props.relationships[rel].data ? props.relationships[rel].data.id : null;
          properties.attr('relationships.' + rel, true);
        }
      }
      can.batch.stop();
      return obj;
    }
  });
}
