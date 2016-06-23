<!--

@module {can.Component} ol-map <ol-map />
@parent geocola.components

-->

## Description

A openlayers map component that provides a wrapper for `ol.Map` along with additional functionality. This ol-map component provides a centralized map click handler so that different widgets may activate and deactivate their map click event. Several widgets use and require a reference to an ol-map component via a map-node attribute.

## Usage

```html
<ol-map id="main-map" x="-90" y="45">
</ol-map>`
```

## Demo

This demo uses can.route to keep track of the current position and zoom level
of the map. After refreshing the application, the position will be where you
left it. In addition, the browsers forward and back buttons may be used to
zoom the map to previous extents.

**Because the demo is in an iframe, this functionality may not work quite right.
Instead try opening it in [Full Screen](../ol-map/demo.html).**

@demo ol-map/demo.html 500
