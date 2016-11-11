import DefineMap from 'can-define/map/map';

export const Manager = DefineMap.extend({
    map: {
        value: null
    },
    layers: {
        get () {
            if (!this.attr('map')) {
                return [];
            }
            const layers = this.attr('map').getLayers();
        }
    }
});
