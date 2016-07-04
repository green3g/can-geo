import can from 'can/util/library';
import List from 'can/list/';
import CanMap from 'can/map/';
import 'can/map/define/';
import Component from 'can/component/';
import template from './measure.stache!';
import './measure.css!';
import measurements from './modules/measurements';

/**
 * @constructor measure-widget.ViewModel ViewModel
 * @parent measure-widget
 * @group measure-widget.ViewModel.props Properties
 *
 * @description A `<measure-widget />` component's ViewModel
 */
export const ViewModel = CanMap.extend({
  /**
   * @prototype
   */
  define: {
    /**
     * An array of measurement objects to use. These are configureable in `./modules/measurements`
     * @property {Array<measurementObjects>} measure-widget.ViewModel.props.measurements
     * @parent measure-widget.ViewModel.props
     */
    measurements: {
      value: measurements
    },
    /**
     * The current value in the units dropdown
     * @property {String} measure-widget.ViewModel.props.unitsDropdown
     * @parent measure-widget.ViewModel.props
     */
    unitsDropdown: {
      value: '',
      type: 'string'
    },
    /**
     * Should labels be added to the map drawings by default
     * @property {Boolean} measure-widget.ViewModel.props.addLabels
     * @parent measure-widget.ViewModel.props
     */
    addLabels: {
      value: true,
      type: 'boolean'
    },
    /**
     * The name of the click handler key to use. The default is `'measure'`.
     * @property {String} measure-widget.ViewModel.props.clickHandler
     * @parent measure-widget.ViewModel.props
     */
    clickHandler: {},
    overlayManger: {}
  },
  /**
   * This is the function called when a tool button is clicked. Activates a measure tool if is not already active. If it is already active, it deactivates the measure tool.
   * @signature
   * @param  {measureToolObject} measureTool The tool to activate
   */
  activateMeasureTool: function(measureTool) {
    //toggle the button
    measureTool.attr('active', !measureTool.attr('active'));
    if (measureTool.attr('active')) {
      //unselect other buttons
      this.measurements.each(function(measure) {
        if (measure.attr('type') !== measureTool.attr('type')) {
          measure.attr('active', false);
        }
      });
      this.attr('overlayManager').activate(measureTool);
      this.attr('unitsDropdown', measureTool.attr('units')[0].attr('value'));
      this.attr('overlayManager').changeUnits(this.attr('unitsDropdown'));
    } else {
      this.deactivateMeasureTool();
    }
  },
  /**
   * Calls methods to deactivate the measure widget
   * @signature
   */
  deactivateMeasureTool: function() {
    this.attr('overlayManager').deactivate();
  },
  /**
   * Calls methods to clear the overlay layers
   * @signature
   */
  clearMeasurements: function() {
    this.attr('overlayManager').clearMeasureOverlays();
  },
  /**
   * Calls methods to update the units on the overlay layers
   * @signature
   */
  changeUnits: function() {
    this.attr('overlayManager').changeUnits(this.attr('unitsDropdown'));
  },
  /**
   * Calls methods to toggle labels on the overlay layers
   * @signature
   */
  toggleLabels: function() {
    this.attr('overlayManager.addLabels', !this.attr('overlayManager.addLabels'));
  }
});

export default Component.extend({
  tag: 'measure-widget',
  template: template,
  viewModel: ViewModel
});
