import can from 'can/util/library';
import Component from 'can/component/';
import CanMap from 'can/map/';
import template from './print.stache!';

/**
 * @constructor print-widget.ViewModel ViewModel
 * @parent print-widget
 * @group print-widget.ViewModel.props Properties
 *
 * @description A `<print-widget />` component's ViewModel
 */
export const ViewModel = CanMap.extend({
  /**
   * @prototype
   */
  define: {
    /**
     * @property {String} print-widget.ViewModel.mapTitle mapTitle
     * @parent print-widget.ViewModel.props
     *
     * The default map title to send to the print service.
     */
    mapTitle: {
      type: 'string',
      value: 'Map Print'
    },
    /**
     * The default layout to select from the print widget
     * @property {String}  print-widget.ViewModel.selectedLayout selectedLayout
     * @parent print-widget.ViewModel.props
     */
    selectedLayout: {
      type: 'string',
      value: null
    },
    /**
     * The default dpi to select from the print widget
     * @property {Number}  print-widget.ViewModel.selectedDpi selectedDpi
     * @parent print-widget.ViewModel.props
     */
    selectedDpi: {
      type: 'number',
      value: null
    },
    /**
     * The current list of print results in the widget
     * @property {Array<guides.types.PrintResult>} print-widget.ViewModel.printResults printResults
     * @parent print-widget.ViewModel.props
     */
    printResults: {
      value: []
    },
    /**
     * The print provider to use for printing
     * @property {providers.printProvider} print-widget.ViewModel.provider provider
     * @parent print-widget.ViewModel.props
     */
    provider: {
      value: null
    },
    /**
     * [printOptions description]
     * @type {Object}
     */
    printOptions: {
      set(val) {
        can.$('print-widget select').trigger('change');
        return val;
      },
      get(lastSetValue, setAttr) {
        if (this.attr('provider')) {
          this.attr('provider').getCapabilities().then(setAttr);
        }
      }
    }
  },
  /**
   * @function printButtonClick
   * Called when the print button is clicked to activate the provider's `print` method.
   */
  printButtonClick() {
    if (this.attr('provider') && !this.attr('printing')) {
      this.attr('printing', true);
      this.attr('provider').print({
        map: this.attr('map'),
        layout: this.attr('selectedLayout'),
        dpi: this.attr('selectedDpi'),
        title: this.attr('mapTitle')
      }).then(this.handlePrintout.bind(this));
    }
  },
  /**
   * @function clearButtonClick
   * Click handler for when the clear button is clicked. Empties out the current list of `printResults`
   * @return {[type]} [description]
   */
  clearButtonClick() {
    this.attr('printResults').replace([]);
  },
  /**
   * @function handlePrintout
   * Hanlder for when the print deferred returned by the provider resolves to update add the print result to the list of results
   * @param  {PrintResult} results The result of the printout
   */
  handlePrintout: function(results) {
    this.attr('printing', false);
    this.attr('printResults').push(results);
  }
});

export default Component.extend({
  tag: 'print-widget',
  viewModel: ViewModel,
  template: template,
  events: {
    inserted() {
      var mapViewModel = can.$(this.viewModel.attr('mapNode')).viewModel();
      this.viewModel.initMap(mapViewModel);
    }
  }
});
