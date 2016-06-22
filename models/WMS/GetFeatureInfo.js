import connect from 'can-connect';

export const DEFAULT_PARAMETERS = {
  service: 'wms',
  version: '1.3.0',
  request: 'GetFeatureInfo',
  crs: 'EPSG:3857',
  info_format: 'application/json',
  feature_count: 10,
  buffer: 10
};
