import template from './property-table.stache!';
// import './property-table.css!';
import List from 'can/list/';
import CanMap from 'can/map/';
import Component from 'can/component/';
import CanEvent from 'can/event/';
import { makeSentenceCase } from '../../util/string';
import { parseFieldArray, Field } from '../../util/field';
/**
 * @constructor property-table.ViewModel ViewModel
 * @parent property-table
 * @group property-table.ViewModel.props Properties
 *
 * @description A `<property-table />` component's ViewModel
 */
export const ViewModel = CanMap.extend({
  /**
   * @prototype
   */
  define: {
    /**
     * A flag to allow editing (Not yet implemented)
     * TODO: implement editing
     * @property {Boolean} property-table.ViewModel.props.edit
     * @parent property-table.ViewModel.props
     */
    edit: {
      type: 'boolean',
      value: true
    },
    /**
     * A flag to allow deleting (Not yet implemented)
     * TODO: implement deleting
     * @property {Boolean} property-table.ViewModel.props.delete
     * @parent property-table.ViewModel.props
     */
    delete: {
      type: 'boolean',
      value: true
    },
    /**
     * The ID value of the object that should be retrieved. This value along with the connection object will be used to retrieve an object from a RESTful service
     * @property {Number} property-table.ViewModel.props.objectId
     * @parent property-table.ViewModel.props
     */
    objectId: {
      type: 'number',
      set(id) {
        this.fetchObject(this.attr('connection'), id);
        return id;
      }
    },
    /**
     * The The connection object that should be used to retrieve an object. This value along with the objectId value will be used to retrieve an object from a RESTful service
     * @property {providers.apiProvider} property-table.ViewModel.props.connection
     * @parent property-table.ViewModel.props
     */
    connection: {
      set(con) {
        this.fetchObject(con, this.attr('objectId'));
        return con;
      }
    },
    /**
     * A generic object to display in a tabular format. This can be used instead of providing a connection and objectId property
     * @property {can.Map | Object} property-table.ViewModel.props.object
     * @parent property-table.ViewModel.props
     */
    object: {
      Type: CanMap
    },
    /**
     * A promise that resolves to the object. Used to determine state of current fetching operations
     * @property {Promise | `null`}  property-table.ViewModel.props.objectPromise
     * @parent property-table.ViewModel.props
     */
    objectPromise: {},
    /**
     * A configuration object defining exactly how to display the properties fields and values
     * @property {property-table.types.tablePropertiesObject} property-table.ViewModel.props.fieldProperties
     * @parent property-table.ViewModel.props
     */
    fieldProperties: {
      value: null
    },
    fields: {
      Value: List,
      get(fields) {
        if(fields.length && !(fields[0] instanceof Field)){
          fields = parseFieldArray(fields);
        }
        if (!fields.length && this.attr('object')) {
          return parseFieldArray(CanMap.keys(this.attr('object')));
        }
        return fields.filter(f => {
          return !f.attr('excludePropertyTable');
        });
      }
    }
  },
  /**
   * @function fetchObject
   * Asynchronously fetches an object using a can-connect model and an id
   * @signature
   * @param  {can-connect.model} con The connection object to an api resource
   * @param  {Number} id  The id number of the object to retrieve
   * @return {can.Deferred}     A deferred object that is resolved once the object is retreived
   * @link https://connect.canjs.com/ can-connect
   */
  fetchObject(con, id) {
    if (!con || !id) {
      return;
    }
    let self = this;
    let def = con.get({
      id: id
    });
    def.then(obj => {
      self.attr('object', obj);
    });

    this.attr('objectPromise', def);
    return def;
  },
  /**
   * @function getValue
   * A helper for the template that gets an object's property using the field
   * @signature
   * @param  {field} field The field object
   * @return {string}       The formatted string
   */
  getValue(field) {
    return field.getFormattedValue(this.attr('object'));
  }
});
can.extend(ViewModel.prototype, CanEvent);

export default Component.extend({
  tag: 'property-table',
  viewModel: ViewModel,
  template: template
});
export default ViewModel;
