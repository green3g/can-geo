import Component from 'can-component';
import DefineMap from 'can-define/map/map';
import template from './print.stache!';

import 'spectre-canjs/nav-container/';
import dev from 'can-util/js/dev/dev';

/**
 * @constructor print-widget.ViewModel ViewModel
 * @parent print-widget
 * @group print-widget.ViewModel.props Properties
 *
 * @description A `<print-widget />` component's ViewModel
 */
export const ViewModel = DefineMap.extend({
    /**
     * @prototype
     */
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
        value: null,
        set (provider) {
            if (provider) {
                provider.loadCapabilities().then((data) => {
                    this.printOptions = data;
                });
            }
            return provider;
        }
    },
    /**
     * The available print options like size, dpi, etc
     * @property {Object} print-widget.ViewModel.provider provider
     * @parent print-widget.ViewModel.props
     */
    printOptions: {
        value: null,
        set (options) {
            if (!options) {
                return options;
            }
            this.set({
                selectedDpi: options.dpis[0].value,
                selectedLayout: options.layouts[0].name
            });
            return options;
        }
    },
    /**
     * a map object that will pair with a print provider to provide a printed map
     * @property {Any} print-widget.ViewModel.provider provider
     * @parent print-widget.ViewModel.props
     */
    map: '*',
    /**
     * Whether or not we're currently printing an output
     * @property {Any} print-widget.ViewModel.isPrinting
     * @parent print-widget.ViewModel.props
     */
    isPrinting: 'boolean',
    /**
     * Called when the print button is clicked to activate the provider's `print` method.
     * @function printButtonClick
     */
    printButtonClick () {
        if (!this.map) {
            dev.error('Print: Map is not set');
        }

        if (this.provider && !this.isPrinting) {
            this.isPrinting = true;
            this.provider.print({
                map: this.map,
                layout: this.selectedLayout,
                dpi: this.selectedDpi,
                title: this.mapTitle
            }).then(this.handlePrintout.bind(this));
        }
    },
    /**
     * Click handler for when the clear button is clicked. Empties out the current list of `printResults`
     * @function clearButtonClick
     */
    clearButtonClick () {
        this.printResults.replace([]);
    },
    /**
     * Hanlder for when the print deferred returned by the provider resolves to update add the print result to the list of results
     * @function handlePrintout
     * @param  {PrintResult} results The result of the printout
     */
    handlePrintout: function (results) {
        this.isPrinting = false;
        this.printResults.push(results);
    }
});

export default Component.extend({
    tag: 'print-widget',
    ViewModel: ViewModel,
    view: template
});
