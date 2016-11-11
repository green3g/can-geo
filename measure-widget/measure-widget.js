
import DefineMap from 'can-define/map/map';

import Component from 'can-component';
import template from './measure.stache!';
import './measure.css!';
import measurements from './modules/measurements';
import OverlayManager from './contrib/OlManager';

/**
 * @constructor measure-widget.ViewModel ViewModel
 * @parent measure-widget
 * @group measure-widget.ViewModel.props Properties
 *
 * @description A `<measure-widget />` component's ViewModel
 */
export const ViewModel = DefineMap.extend('MeasureWidget', {
  /**
   * @prototype
   */
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
    clickHandler: '*',
    /**
     * a map interaction handler object that has
     * activate and deactivate methods
     * @type {String}
     */
    overlayManger: {
        type: '*',
        value: null,
        set (m) {
            return m;
        }
    },
    map: {
        set (map) {
            if (map) {
                this.overlayManager = new OverlayManager({map: map});
            }
            return map;
        }
    },
  /**
   * This is the function called when a tool button is clicked. Activates a measure tool if is not already active. If it is already active, it deactivates the measure tool.
   * @signature
   * @param  {measureToolObject} measureTool The tool to activate
   */
    activateMeasureTool: function (measureTool) {
        //toggle the button
        measureTool.active = !measureTool.active;
        if (measureTool.active) {
            //unselect other buttons
            this.measurements.each(function (measure) {
                if (measure.type !== measureTool.type) {
                    measure.active = false;
                }
            });
            this.overlayManager.activate(measureTool);
            this.unitsDropdown = measureTool.units[0].value;
            this.overlayManager.changeUnits(this.unitsDropdown);
        } else {
            this.deactivateMeasureTool();
        }
    },
  /**
   * Calls methods to deactivate the measure widget
   * @signature
   */
    deactivateMeasureTool: function () {
        this.overlayManager.deactivate();
    },
  /**
   * Calls methods to clear the overlay layers
   * @signature
   */
    clearMeasurements: function () {
        this.overlayManager.clearMeasureOverlays();
    },
  /**
   * Calls methods to update the units on the overlay layers
   * @signature
   */
    changeUnits: function () {
        this.overlayManager.changeUnits(this.unitsDropdown);
    },
  /**
   * Calls methods to toggle labels on the overlay layers
   * @signature
   */
    toggleLabels: function () {
        this.overlayManager.addLabels = !this.overlayManager.addLabels;
    }
});

export default Component.extend({
    tag: 'measure-widget',
    view: template,
    viewModel: ViewModel
});
