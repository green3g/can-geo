import CanMap from 'can/map/';
import 'can/map/define/';
import List from 'can/list/';
export const Filter = CanMap.extend({
  define: {
    value: {},
    name: {
      type: 'string',
      value: ''
    },
    operator: {
      value: 'like'
    }
  }
});

export const FilterList = List.extend({
  'Map': CanMap
});

export const FilterOptions = [{
  label: 'Does not contain',
  value: 'not_like',
  types: ['string']
}, {
  label: 'Contains',
  value: 'like',
  types: ['string'],
  filterFactory(filter) {
    filter.attr('value', ['%', filter.attr('value'), '%'].join(''));
    return filter;
  }
}, {
  label: 'Starts with',
  value: 'starts_with',
  types: ['string'],
  filterFactory(filter) {
    filter.attr('value', [filter.attr('value'), '%'].join(''));
    return filter;
  }
}, {
  label: 'Ends with',
  value: 'ends_with',
  types: ['string'],
  filterFactory(filter) {
    filter.attr('value', ['%', filter.attr('value')].join(''));
    return filter;
  }
}, {
  label: 'Exactly equal to',
  value: 'equals',
  types: ['string', 'number', 'boolean', 'date']
}, {
  label: 'Not exactly equal to',
  operator: 'not_equal_to',
  value: 'not_equal_to',
  types: ['string', 'number', 'boolean', 'date']
}, {
  label: 'Greater Than',
  value: 'greater_than',
  types: ['number'],
  filterFactory(filter) {
    filter.attr('value', parseFloat(filter.attr('value')));
    return filter;
  }
}, {
  label: 'Less Than',
  value: 'less_than',
  types: ['number'],
  filterFactory(filter) {
    filter.attr('value', parseFloat(filter.attr('value')));
    return filter;
  }
}, {
  label: 'Before',
  value: 'before',
  types: ['date'],
  valueField: {
    name: 'value',
    alias: 'Value',
    type: 'date',
    properties: {
      placeholder: 'Select a date'
    }
  }
}, {
  label: 'After',
  value: 'after',
  types: ['date'],
  valueField: {
    name: 'value',
    alias: 'Value',
    type: 'date',
    properties: {
      placeholder: 'Select a date'
    }
  }
}];
