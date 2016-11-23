<!--

@module {can.Component} identify-widget <identify-widget />
@parent geo.components
-->

## Description
A configureable feature identify tool for wms layers using wms `GetFeatureInfo` protocol. The wms server must be capable of privoviding json results
- Queries wms layers and displays the results when map is clicked
- Works inside an ol-popup componenet by centering the popup on a feature geometry when a feature is selected
- Support for customizing each field and the entire feature's properties is baked in

## Usage
This component may be placed inside an `ol-popup` component, but it doesn't have to be.
```html
<ol-popup id="identify">
  <identify-widget {layer-properties}="propsObj" {map}="map" popup-selector="#identify" />
</ol-popup>
```

## Example

@demo identify-widget/demo.html 500
