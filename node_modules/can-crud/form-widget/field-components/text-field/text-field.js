
import can from 'can/util/library';
import CanEvent from 'can/event/';
import CanMap from 'can/map/';
import Component from 'can/component/';
import template from './text-field.stache!';
/**
 * @constructor form-widget/field-components/text-field.ViewModel ViewModel
 * @parent form-widget/text-date-field
 * @group form-widget/field-components/text-field.ViewModel.props Properties
 *
 * @description A `<text-field />` component's ViewModel
 */
export let ViewModel = CanMap.extend({
  define: {
    properties: {
      Value: can.Map
    }
  },
  onChange(element) {
    this.dispatch('change', [element.value]);
  }
});
can.extend(ViewModel.prototype, CanEvent);

Component.extend({
  tag: 'text-field',
  template: template,
  viewModel: ViewModel
});
