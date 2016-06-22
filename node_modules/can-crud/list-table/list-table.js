import template from './list-table.stache!';
import './list-table.less!';
import List from 'can/list/';
import Component from 'can/component/';
import CanMap from 'can/map/';
import CanEvent from 'can/event/';
import 'can/map/define/';
import can from 'can/util/library';
import { Field, parseFieldArray } from '../util/field';

/**
 * @constructor list-table.ViewModel ViewModel
 * @parent list-table
 * @group list-table.ViewModel.props Properties
 *
 * @description A `<list-table />` component's ViewModel
 */
export const ViewModel = CanMap.extend({
  /**
   * @prototype
   */
  define: {
    /**
     * Optional promise or deferred object that will resolve to an object. Once
     * the promise resolves, the objects list will be replaced with the promise result
     * @parent list-table.ViewModel.props
     * @property {can.Deferred | Promise} list-table.ViewModel.props.promise
     */
    promise: {
      set(newVal) {
        var self = this;
        newVal.then(function(objects) {
          self.attr('objects').replace(objects);
        });
        return newVal;
      }
    },
    /**
     * A list of objects to display. These objects should generally be can.Model
     * objects but may be any can.Map or javascript object.
     * @parent list-table.ViewModel.props
     * @property {Array.<can.Model | can.Map | Object>} list-table.ViewModel.props.objects
     */
    objects: {
      Value: List,
      Type: List
    },
    /**
     * A list of the currently selected objects in the table
     * @parent list-table.ViewModel.props
     * @property {Array.<can.Map>} list-table.ViewModel.props.selectedObjects
     */
    selectedObjects: {
      Value: List,
      Type: List
    },
    /**
     * A virtual property that helps the template determine whether all objects are selected
     * @parent list-table.ViewModel.props
     * @property {Boolean} list-table.ViewModel.props._allSelected
     */
    _allSelected: {
      type: 'boolean',
      get() {
        return this.attr('selectedObjects').length === this.attr('objects').length;
      }
    },
    /**
     * An array of buttonObjects
     * @parent list-table.ViewModel.props
     * @property {Array.<geocola.types.TableButtonObject>} list-table.ViewModel.props.buttons
     */
    buttons: {
      value: List
    },
    /**
     * An array of fields
     * @parent list-table.ViewModel.props
     * @property {can.List} list-table.ViewModel.props.fields
     */
    fields: {
      Value: List,
      Type: List,
      get(fields) {
        if (fields.length && !(fields[0] instanceof Field)) {
          fields = parseFieldArray(fields);
        }
        if (!fields.length && this.attr('objects')) {
          return parseFieldArray(CanMap.keys(this.attr('objects')[0]));
        }
        return fields.filter(f => {
          return !f.excludeListTable;
        });
      }
    },
    /**
     * The current sort field
     * @parent list-table.ViewModel.props
     * @property {can.List} list-table.ViewModel.props.currentSort
     */
    currentSort: {
      value: function() {
        return new CanMap({
          fieldName: null,
          type: 'asc'
        });
      }
    }
  },
  /**
   * @function buttonClick
   * Called when a button is clicked. This dispatches the buttons event.
   * @signature
   * @param  {String} eventName The name of the event to dispatch
   * @param  {can.Map} object  The row data
   */
  buttonClick(eventName, object) {
    this.dispatch(eventName, [object]);
  },
  /**
   * @function setSort
   * Helps the template the currentSort value
   * @signature
   * @param  {String} field the field to set the sort on
   */
  setSort(field) {
    can.batch.start();
    if (this.attr('currentSort.fieldName') !== field) {
      this.attr('currentSort').attr({
        fieldName: field,
        type: 'asc'
      });
    } else {
      this.attr('currentSort.type', this.attr('currentSort.type') === 'asc' ? 'desc' : 'asc');
    }
    can.batch.stop();
    this.dispatch('sort', [this.attr('currentSort')]);
  },
  /**
   * @function toggleSelected
   * Toggles a row as selected or not selected
   * @signature
   * @param  {can.Map} obj The row to toggle
   */
  toggleSelected(obj) {
    var index = this.attr('selectedObjects').indexOf(obj);
    if (index > -1) {
      this.attr('selectedObjects').splice(index, 1);
    } else {
      this.attr('selectedObjects').push(obj);
    }
  },
  /**
   * @function toggleSelectAll
   * Selects or unselects all of the objects in the table
   * @signature
   */
  toggleSelectAll() {
    if (this.attr('selectedObjects').length < this.attr('objects').length) {
      this.attr('selectedObjects').replace(this.attr('objects'));
    } else {
      this.attr('selectedObjects').replace([]);
    }
  },
  /**
   * @function isSelected
   * Determines whether or not the provided object is selected by comparing
   * it to the list of currently selected objects
   * @signature
   * @param  {can.Map | Object} obj The object to check if is selected
   * @return {Boolean}     Whether or not it is selected
   */
  isSelected(obj) {
    return this.attr('selectedObjects').indexOf(obj) > -1;
  },
  /**
   * @function getFieldValue
   * Returns an objects formatted value for the template
   * @signature
   * @param  {field} field The field object. This field object has a property
   * called  `getFormattedValue` which formats and returns a string
   * @param  {can.Map} obj   The object to retrieve the property from
   * @return {String}       The formatted value
   */
  getFieldValue(field, obj) {
    return field.getFormattedValue(obj);
  }
});
can.extend(ViewModel.prototype, CanEvent);

export default Component.extend({
  tag: 'list-table',
  viewModel: ViewModel,
  template: template
});
export default ViewModel;
