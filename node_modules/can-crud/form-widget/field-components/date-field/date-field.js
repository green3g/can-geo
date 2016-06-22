
import can from 'can/util/library';
import CanEvent from 'can/event/';
import CanMap from 'can/map/';
import Component from 'can/component/';

import 'date-selector/less/datepicker.less!';
import dateSelector from 'date-selector';

import template from './date-field.stache!';
import './date-field.less!';

/**
 * @constructor form-widget/field-components/date-field.ViewModel ViewModel
 * @parent form-widget/field-components/date-field
 * @group form-widget/field-components/date-field.ViewModel.props Properties
 *
 * @description A `<date-field />` component's ViewModel
 */
export let ViewModel = CanMap.extend({
  define: {
    properties: {
      Value: CanMap
    }
  },
  onChange(element) {
    this.dispatch('change', [element.value]);
  }
});

can.extend(ViewModel.prototype, CanEvent);

Component.extend({
  tag: 'date-field',
  template: template,
  viewModel: ViewModel,
  events: {
    inserted: function() {
      dateSelector();
    }
  }
});
