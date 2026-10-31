// 1. Define the focus region (Telangana, India bounding box coordinate geometry)
var targetRegion = ee.Geometry.Polygon([
  [[77.0, 16.0], [81.0, 16.0], [81.0, 19.5], [77.0, 19.5]]
]);

// 2. Center the web map display over your target coordinates
Map.centerObject(targetRegion, 7);

// 3. Fetch Sentinel-2 Satellite imagery for October 2026
var satelliteCollection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(targetRegion)
  .filterDate('2026-10-01', '2026-10-31') // Pulls data from this current month
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 15)); // Removes cloudy photos

// 4. Function to compute NDVI (Vegetation and Water Stress Index)
var calculateNDVI = function(image) {
  var ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');
  return image.addBands(ndvi);
};

// Apply computation across the dataset collection and calculate average median conditions
var processedImages = satelliteCollection.map(calculateNDVI);
var monthlyAverage = processedImages.select('NDVI').median().clip(targetRegion);

// 5. Define visualization colors (Red = Severe Drought/Dry Soil, Green = Healthy/Hydrated Vegetation)
var colorPalette = {
  min: 0.0,
  max: 0.7,
  palette: ['#FFFFFF', '#CE7E45', '#DF923E', '#F1B555', '#FCD163', '#99B718', '#74A901', '#66A200', '#529400', '#3E8601', '#207401', '#056201', '#004C00', '#023B01', '#012E01', '#011D01', '#011301']
};

// 6. Project the processing computation directly onto the interactive map view
Map.addLayer(monthlyAverage, colorPalette, 'Telangana October Drought Index');

// 7. Isolate extreme drought coordinates (NDVI values dropping dangerously low)
var lowVegetationThreshold = monthlyAverage.lt(0.2); // Flags dried up/stressed zones
var criticalZones = lowVegetationThreshold.updateMask(lowVegetationThreshold);
Map.addLayer(criticalZones, {palette: ['#FF0000']}, 'CRITICAL RELIEF ZONES (RED)');
