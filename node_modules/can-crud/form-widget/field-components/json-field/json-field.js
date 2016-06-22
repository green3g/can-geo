
import can from 'can/util/library';
import Component from 'can/component/';
import CanMap from 'can/map/';
import CanEvent from 'can/event/';
import template from './json-field.stache!';
import { mapToFields, parseFieldArray } from '../../../../util/field';

/**
 * @constructor form-widget/field-components/json-field.ViewModel ViewModel
 * @parent form-widget/field-components/json-field
 * @group form-widget/field-components/json-field.ViewModel.props Properties
 *
 * @description A `<json-field />` component's ViewModel
 */
export let ViewModel = CanMap.extend({
  define: {
    properties: {
      Value: CanMap
    },
    jsonFormObject: {
      get: function(val) {
        let template = this.attr('properties.objectTemplate');
        let obj = this.attr('value') ? JSON.parse(this.attr('value')) : {};
        if (template) {
          return new template(obj);
        }
        return null;
      }
    },
    formFields: {
      get(){
        if(this.attr('properties.fields')){
          return parseFieldArray(this.attr('properties.fields'));
        }
        return mapToFields(this.attr('jsonFormObject'));
      }
    }
  },
  saveField: function(scope, dom, event, obj) {
    let json = JSON.stringify(obj.attr());
    this.attr('value', json);
    this.dispatch('change', [json]);
  }
});
can.extend(ViewModel.prototype, CanEvent);

Component.extend({
  tag: 'json-field',
  template: template,
  viewModel: ViewModel
});
