
import DefineMap from 'can-define/map/map';
import DefineList from 'can-define/list/list';
import $ from 'jquery';

/**
 * @constructor providers/location/EsriGeocoder EsriGeocoder
 * @parent locationProvider.providers
 * @group EsriGeocoder.props Properties
 * @description
 * Provides abstraction for Esri's ArcGIS Online or ArcGIS for Server geocoders
 */
export default DefineMap.extend('EsriGeocoder', {
    /**
     * The url of the esri geocoder
     * @property {String} EsriGeocoder.props.url
     * @parent EsriGeocoder.props
     */
    url: 'string',
    /**
     * The max number of locations to return. The default is 5.
     * @property {Number} EsriGeocoder.props.maxLocations
     * @parent EsriGeocoder.props
     */
    maxLocations: {
        type: 'number',
        value: 5
    },
    /**
     * An optional point to send to the ArcGIS Geocoder to begin searching from.
     * @property {Number[]} EsriGeocoder.props.searchPoint
     * @parent EsriGeocoder.props
     */
    searchPoint: DefineList,
    searchText: 'string',
    minSearchLength: {
        type: 'number',
        value: 5
    },
    deferred: '*',
    suggestionPromise: {
        get () {
            if (!this.searchText || !(this.searchText.length > this.minSearchLength)) {
                return null;
            }
            return new Promise((resolve, reject) => {
                const promise = $.ajax({
                    url: this.url + '/suggest',
                    data: {
                        f: 'json',
                        text: this.searchText,
                        location: this.searchPoint ? this.searchPoint.join(',') : '',
                        maxLocations: this.maxLocations
                    },
                    dataType: 'json',
                    method: 'GET'
                });

                // resolve the promise
                promise.then((data) => {
                    const returnData = {
                        suggestions: data.suggestions.map((item) => {
                            return item.text;
                        }),
                        response: data
                    };
                    resolve(returnData);
                });

                // reject if fail
                promise.catch(reject);
            });
        }
    },
    suggestions: {
        value: DefineList,
        get (val) {
            if (!this.suggestionPromise) {
                val.replace([]);
                return val;
            }
            this.suggestionPromise.then((data) => {
                val.replace(data.suggestions);
            });
            return val;
        }
    },
    searchAddress: {
        type: 'string',
        value: null
    },
    locationPromise: {
        get () {
            if (!this.searchAddress) {
                return null;
            }
            return new Promise((resolve, reject) => {
                const promise = $.ajax({
                    url: this.url + '/findAddressCandidates',
                    data: {
                        f: 'json',
                        singleLine: this.searchAddress
                    },
                    method: 'GET',
                    dataType: 'json'
                });

                // resolve the promise
                promise.then((data) => {
                    const returnData = {
                        items: data.candidates.map((item) => {
                            return {
                                x: item.location.x,
                                y: item.location.y,
                                address: item.address
                            };
                        }),
                        response: data
                    };
                    resolve(returnData);
                });

                // reject if fail
                promise.catch(reject);
            });
        }
    },
    location: {
        Value: DefineMap,
        get (val) {
            this.locationPromise.then((data) => {
                this.location = data.items[0];
            });
            return val;
        }
    }
});
