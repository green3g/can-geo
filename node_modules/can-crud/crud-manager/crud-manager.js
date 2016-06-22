import can from 'can/util/library';
import CanMap from 'can/map/';
import 'can/map/define/';
import List from 'can/list/';
import Component from 'can/component/';
import Route from 'can/route/';
import template from './template.stache!';
import './widget.less!';

import '../list-table/';
import '../property-table/';
import '../form-widget/';
import '../filter-widget/';
import '../paginate-widget/';

import 'can-ui/modal-container/';
import 'can-ui/tab-container/';
import 'can-ui/panel-container/';
import { Message } from 'can-ui/alert-widget/message';

import { FilterList } from '../filter-widget/Filter';
import { mapToFields, parseFieldArray } from '../util/field';
import PubSub from 'pubsub-js';

export const TOPICS = {
  /**
   * Topic to add a new message when an object is modified or deleted. The topic
   * published is `addMessage`
   * @property {String} crud-manager.ViewModel.topics.ADD_MESSAGE
   * @parent crud-manager.ViewModel.topics
   */
  ADD_MESSAGE: 'addMessage',
  /**
   * topic to clear existing messages. The topic
   * published is `clearMessages`
   * @property {String} crud-manager.ViewModel.topics.CLEAR_MESSAGES
   * @parent crud-manager.ViewModel.topics
   */
  CLEAR_MESSAGES: 'clearMessages'
};

const DEFAULT_BUTTONS = [{
  iconClass: 'fa fa-list-ul',
  eventName: 'view',
  title: 'View Row Details'
}];
const EDIT_BUTTONS = DEFAULT_BUTTONS.concat([{
  iconClass: 'fa fa-pencil',
  eventName: 'edit',
  title: 'Edit Row'
}, {
  iconClass: 'fa fa-trash',
  eventName: 'delete',
  title: 'Remove Row'
}]);

export const SortMap = CanMap.extend({
  fieldName: null,
  type: 'asc'
});
/**
 * @module crud-manager
 */

/**
 * @constructor crud-manager.ViewModel ViewModel
 * @parent crud-manager
 * @group crud-manager.ViewModel.props Properties
 * @group crud-manager.ViewModel.topics Topics
 *
 * @description A `<crud-manager />` component's ViewModel
 */
export let ViewModel = CanMap.extend({
  /**
   * @prototype
   */
  define: {
    /**
     * The view object for this crud-manager
     * @property {can.Map} crud-manager.ViewModel.props.view
     * @parent crud-manager.ViewModel.props
     */
    view: {},
    /**
     * The current page to display in this view. Options include:
     * * `all`: The list table page that displays all records
     * * `details`: The individual view page that shows one detailed record
     * * `edit`: The editing view that allows editing of an individual record using a form
     * @property {String} crud-manager.ViewModel.props.page
     * @parent crud-manager.ViewModel.props
     */
    page: {
      value: 'all',
      type: 'string'
    },
    /**
     * A virtual property that calculates the number of total pages to show
     * on the list page. This controls the paginator widget. It uses the property
     * `view.connectionProperties.totalItems`  and `queryPerPage` to perform this calculation.
     * @property {String} crud-manager.ViewModel.props.totalPages
     * @parent crud-manager.ViewModel.props
     */
    totalPages: {
      get(val, setAttr) {
        //round up to the nearest integer
        return Math.ceil(this.attr('view.connectionProperties.totalItems') /
          this.attr('parameters.perPage'));
      }
    },
    /**
     * A helper to show or hide the paginate-widget. If totalPages is less than
     * 2, the paginate widget will not be shown.
     * @property {Boolean} crud-manager.ViewModel.props.showPaginate
     * @parent crud-manager.ViewModel.props
     */
    showPaginate: {
      type: 'boolean',
      get() {
        return this.attr('totalPages') > 1;
      }
    },
    parameters: {
      Value: CanMap.extend({
        define: {
          filters: { Type: FilterList, Value: FilterList },
          perPage: { type: 'number', value: 10 },
          page: { type: 'number', value: 0 },
          sort: { Type: SortMap, Value: SortMap }
        }
      })
    },
    /**
     * A promise that resolves to the objects retrieved from a can-connect.getList call
     * @property {can.Deferred} crud-manager.ViewModel.props.objects
     * @parent crud-manager.ViewModel.props
     */
    objects: {
      get(prev, setAttr) {
        let params = this.attr('parameters') ? this.attr('parameters').serialize() : {};
        let promise = this.attr('view.connection').getList(params);
        //handle promise.fail for deferreds
        let dummy = promise.fail ? promise.fail(err => {
            console.error('unable to complete objects request', err);
          }) :
          //and handle promise.catch for local-storage deferreds...
          promise.catch(err => {
            console.error('unable to complete objects request', err);
          });
        return promise;
      }
    },
    /**
     * A promise that resolves to the object retreived from a `can-connect.get` call
     * @property {can.Map} crud-manager.ViewModel.props.focusObject
     * @parent crud-manager.ViewModel.props
     */
    focusObject: {
      get(prev, setAttr) {
        if (this.attr('viewId')) {
          let params = {};
          params[this.attr('view.connection').idProp] = this.attr('viewId');
          let promise = this.attr('view.connection').get(params);
          let dummy = promise.fail ? promise.fail(function(err) {
            console.error('unable to complete focusObject request', err);
          }) : promise.catch(function(err) {
            console.error('unable to complete focusObject request', err);
          });
          return promise;
        }
        return null;
      }
    },
    /**
     * Buttons to use for the list table actions. If `view.disableEdit` is falsey
     * the buttons will include an edit and delete button. Otherwise, it will be
     * a simple view details button.
     * @property {Array<geocola.types.TableButtonObject>} crud-manager.ViewModel.props.buttons
     * @parent crud-manager.ViewModel.props
     */
    buttons: {
      type: '*',
      get() {
        return this.attr('view.disableEdit') ? DEFAULT_BUTTONS : EDIT_BUTTONS;
      }
    },
    /**
     * The page number, this is calculated by incrementing the queryPage by one.
     * @property {Number}  crud-manager.ViewModel.props.pageNumber
     * @parent crud-manager.ViewModel.props
     */
    pageNumber: {
      get() {
        return this.attr('parameters.page') + 1;
      }
    },
    /**
     * The current id number of the object that is being viewed in the property
     * table or edited in the form widget.
     * @property {Number}  crud-manager.ViewModel.props.buttons
     * @parent crud-manager.ViewModel.props
     */
    viewId: {
      type: 'number',
      value: 0
    },
    /**
     * Current loading progress. NOT IMPLEMENTED
     * TODO: implement loading progress on lengthy processes like multi delete
     * @property {Number}  crud-manager.ViewModel.props.progress
     * @parent crud-manager.ViewModel.props
     */
    progress: {
      type: 'number',
      value: 100
    },
    /**
     * Whether or not the filter popup is visible
     * @property {Boolean} crud-manager.ViewModel.props.buttons
     * @parent crud-manager.ViewModel.props
     */
    filterVisible: {
      type: 'boolean',
      value: false
    },
    /**
     * The internal field array that define the display of data and field types
     * for editing and filtering
     * @property {Array<Field>} crud-manager.ViewModel.props._fields
     * @parent crud-manager.ViewModel.props
     */
    _fields: {
      get() {

        //try a fields propety first
        if (this.attr('view.fields')) {
          return parseFieldArray(this.attr('view.fields'));
        }

        //if that doesn't exist, use the objectTemplate to create fields
        return mapToFields(this.attr('view.objectTemplate'));
      }
    },
    /**
     * An array of currently selected objects in the list-table
     * @property {Array<can.Map>} crud-manager.ViewModel.props.selectedObjects
     * @parent crud-manager.ViewModel.props
     */
    selectedObjects: {
      Value: List
    }
  },
  /**
   * @function init
   * Initializes filters and other parameters
   */
  init() {
    //if parameters are in the view, mix them in to the crud parameters
    if (this.attr('view.parameters')) {
      this.attr('parameters').attr(this.attr('view.parameters').serialize());
    }
    //set up related filters
    if (this.attr('relatedField') && this.attr('relatedValue')) {
      this.attr('parameters.filters').push({
        name: this.attr('relatedField'),
        operator: 'equals',
        value: this.attr('relatedValue')
      });
    }

  },
  /**
   * @function editObject
   * Sets the current viewId to the object's id and sets the page to edit
   * to start editing the object provided.
   * @signature
   * @param  {can.Map} scope The stache scope (not used)
   * @param  {domNode} dom   The domNode that triggered the event (not used)
   * @param  {Event} event The event that was triggered (not used)
   * @param  {can.Map} obj   The object to start editing
   */
  editObject(scope, dom, event, obj) {
    this.attr({
      'viewId': this.attr('view.connection').id(obj),
      'page': 'edit'
    });
  },
  /**
   * @function viewObject
   * Sets the current viewId to the object's id and sets the page to details
   * to display a detailed view of the object provided.
   * @signature
   * @param  {can.Map} scope The stache scope (not used)
   * @param  {domNode} dom   The domNode that triggered the event (not used)
   * @param  {Event} event The event that was triggered (not used)
   * @param  {can.Map} obj   The object to view
   */
  viewObject(scope, dom, event, obj) {
    this.attr({
      'viewId': this.attr('view.connection').id(obj),
      'page': 'details'
    });
  },
  /**
   * @function saveObject
   * Saves the provided object and sets the current viewId to the object's
   * id once it is returned. We then switch the page to the detail view to
   * display the created or updated object.
   *
   * This method also adds notifications once the object is saved using PubSub.
   *
   * @signature
   * @param  {can.Map} scope The stache scope (not used)
   * @param  {domNode} dom   The domNode that triggered the event (not used)
   * @param  {Event} event The event that was triggered (not used)
   * @param  {can.Map} obj   The object to save
   */
  saveObject(scope, dom, event, obj) {
    this.attr('progress', 100);
    this.attr('page', 'loading');
    var deferred = this.attr('view.connection').save(obj);
    deferred.then(result => {
      //add a message
      PubSub.publish(TOPICS.ADD_MESSAGE, new Message({
        message: this.attr('view.saveSuccessMessage'),
        detail: 'ID: ' + this.attr('view.connection').id(result)
      }));

      //update the view id
      this.attr('viewId', result.attr('id'));

      //set page to the details view by default
      this.attr('page', 'details');

    }).fail(e => {
      console.warn(e);
      PubSub.publish(TOPICS.ADD_MESSAGE, new Message({
        message: this.attr('view.saveFailMessage'),
        detail: e.statusText + ' : <small>' + e.responseText + '</small>',
        level: 'danger',
        timeout: 20000
      }));
      this.attr('page', 'all');
    });
    return deferred;
  },
  /**
   * @function setPage
   * Changes the page and resets the viewId to 0
   * @signature
   * @param {String} page The name of the page to switch to
   */
  setPage(page) {
    this.attr({
      'viewId': 0,
      'page': page
    });
  },
  /**
   * @function getNewObject
   * Creates and returns a new object from the view's objectTemplate
   * @signature
   * @return {can.map} A new object created from the `view.objectTemplate`
   */
  getNewObject() {
    //create a new empty object with the defaults provided
    //from the objectTemplate property which is a map
    let props = {};
    if (this.attr('relatedField')) {
      props[this.attr('relatedField')] = this.attr('relatedValue');
    }
    return new(this.attr('view.objectTemplate'))(props);
  },
  /**
   * @function deleteObject
   * Displays a confirm dialog box and if confirmed, deletes the object provided.
   * Once the object is deleted, a message is published using PubSub.
   * @signature
   * @param  {can.Map} scope The stache scope (not used)
   * @param  {domNode} dom   The domNode that triggered the event (not used)
   * @param  {Event} event The event that was triggered (not used)
   * @param  {can.Map} obj   The object to delete
   * @param {Boolean} skipConfirm If true, the method will not display a confirm dialog
   * and will immediately attempt to remove the object
   */
  deleteObject(scope, dom, event, obj, skipConfirm) {
    if (obj && (skipConfirm || confirm('Are you sure you want to delete this record?'))) {
      let deferred = this.attr('view.connection').destroy(obj);
      deferred.then(result => {
        //add a message
        PubSub.publish(TOPICS.ADD_MESSAGE, new Message({
          message: this.attr('view.deleteSuccessMessage'),
          detail: 'ID: ' + this.attr('view.connection').id(result)
        }));
      });

      deferred.fail(result => {
        //add a message
        PubSub.publish(TOPICS.ADD_MESSAGE, new Message({
          message: this.attr('view.deleteFailMessage'),
          detail: result.statusText + ' : <small>' + result.responseText + '</small>',
          level: 'danger',
          timeout: 20000
        }));
      });
      return deferred;
    }
  },
  /**
   * @function deleteMultiple
   * Iterates through the objects in the `selectedObjects` array
   * and deletes each one individually.
   * //TODO implement batch deleting to avoid many ajax calls
   * @signature
   * @param {Boolean} skipConfirm If true, the method will not display a confirm dialog
   * and will immediately attempt to remove the selected objects
   */
  deleteMultiple(skipConfirm) {
    if (skipConfirm || confirm('Are you sure you want to delete the selected records?')) {
      let defs = [];
      this.attr('selectedObjects').forEach((obj) => {
        defs.push(this.deleteObject(null, null, null, obj, true));
      });
      this.attr('selectedObjects').replace([]);
      return defs;
    }
    return null;
  },
  /**
   * @function toggleFilter
   * Toggles the display of the filter dialog
   * @signature
   * @param  {Boolean} val (Optional) whether or not to display the dialog
   */
  toggleFilter(val) {
    if (typeof val !== 'undefined') {
      this.attr('filterVisible', val);
    } else {
      this.attr('filterVisible', !this.attr('filterVisible'));
    }
  },
  /**
   * @function getRelatedValue
   * Retrieves a value from an object based on the key provided
   * @signature
   * @param  {String} foreignKey  The name of the field to retrieve from the object
   * @param  {can.Map} focusObject The object to retrieve the property from
   * @return {*} The object's property
   */
  getRelatedValue(foreignKey, focusObject) {
    return focusObject.attr(foreignKey);
  }
});

Component.extend({
  tag: 'crud-manager',
  viewModel: ViewModel,
  template: template,
  //since this is a recursive component, don't leak the scope.
  //this prevents infinite nesting of the components.
  leakScope: false
});
