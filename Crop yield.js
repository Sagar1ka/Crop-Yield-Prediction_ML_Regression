/*❤♡❤♡❤♡❤♡❤♡❤♡❤♡ 𝙇𝙚𝙖𝙧𝙣 𝙂𝙚𝙤𝙜𝙧𝙖𝙥𝙝𝙮 𝙂𝙄𝙎 𝙂𝙀𝙀 𝙍𝙎 𝙒𝙄𝙏𝙃 𝘼𝙄 ♡❤♡❤♡❤♡❤♡❤♡❤♡❤*/

//Mapping Crop Yield: Predictions, Analysis, and Linear Regression Insights Using Satellite Data
// Example: Linear regression model to predict crop yield using NDVI and FPAR
// Define the study area using the shapefile
//https://www.youtube.com/watch?v=2aUz0mRYEEA&t=569s

var LearnGeographyGISrsWithAI = ee.FeatureCollection("users/roysagarika/Maharastra");

// Load the MODIS/061/MCD15A3H dataset
var modisData = ee.ImageCollection('MODIS/061/MCD15A3H')
                  .filterDate('2019-01-01', '2019-05-31')  // Define the time range
                  .filterBounds(LearnGeographyGISrsWithAI);  // Filter by study area
/*
NDVI (Normalized Difference Vegetation Index): 
This function calculates NDVI, 
an indicator of vegetation health, 
from the MODIS data's 
LAI (Leaf Area Index) and 
FPAR (Fraction of Photosynthetically Active Radiation) bands.
*/
// Function to calculate NDVI (Normalized Difference Vegetation Index)
var calculateNDVI = function(image) {
  var nir = image.select('Lai').multiply(0.1); // Scale LAI band
  var red = image.select('Fpar').multiply(0.01); // Scale FPAR band
  var ndvi = nir.subtract(red).divide(nir.add(red)).rename('NDVI');
  return image.addBands(ndvi);
};

// Function to clip an image to the study area
var clipToLearnGeographyGISrsWithAI = function(image) {
  return image.clip(LearnGeographyGISrsWithAIReprojected);
};

// Function to calculate mean NDVI within the study area
var calculateMeanNDVI = function(image) {
  var meanNDVI = image.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: LearnGeographyGISrsWithAIReprojected,
    scale: 500,  // Resolution in meters
    maxPixels: 1e9
  }).get('NDVI');

  // Add mean NDVI as an image property
  return image.set('mean_ndvi', meanNDVI);
};

// Function to calculate Crop Yield
var predictCropYield = function(image) {
  var ndvi = image.select('NDVI');
  var fpar = image.select('Fpar').multiply(0.01); // Scale FPAR band
  var cropYield = ndvi.multiply(0.5).add(fpar.multiply(0.3)).add(0.2); // Example linear model
  return cropYield;
};

// Function to calculate mean predicted crop yield within the study area
var calculateMeanCropYield = function(image) {
  var meanCropYield = image.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: LearnGeographyGISrsWithAIReprojected,
    scale: 500,  // Resolution in meters
    maxPixels: 1e9
  });
  return image.set('mean_crop_yield', meanCropYield.get('NDVI'));
};

// 1. Reproject the Shapefile
var modisProjection = modisData.first().projection(); // Get the projection of MODIS
var LearnGeographyGISrsWithAIReprojected = LearnGeographyGISrsWithAI.geometry().transform(modisProjection, 10); // Specify a non-zero error margin

// 2. Clip the MODIS Images
var clippedMODIS = modisData.map(clipToLearnGeographyGISrsWithAI);

// 3. Calculate NDVI
var modisWithNDVI = clippedMODIS.map(calculateNDVI);

// 4. Calculate Mean NDVI
var modisWithMeanNDVI = modisWithNDVI.map(calculateMeanNDVI);

// 5. Predict Crop Yield
var cropYieldPrediction = modisWithNDVI.map(predictCropYield);

// 6. Calculate Mean Predicted Crop Yield
var cropYieldWithMean = cropYieldPrediction.map(calculateMeanCropYield);

// Print mean predicted crop yield
print('Mean Predicted Crop Yield:', cropYieldWithMean.aggregate_mean('mean_crop_yield'));

// Print mean NDVI values
var meanNDVIList = modisWithMeanNDVI.aggregate_array('mean_ndvi');
print('Mean NDVI:', meanNDVIList);

// Calculate the overall mean NDVI
var overallMeanNDVI = ee.Number(meanNDVIList.reduce(ee.Reducer.mean()));

// Print the overall mean NDVI
print('Overall Mean NDVI:', overallMeanNDVI);

// Visualize the study area
Map.centerObject(LearnGeographyGISrsWithAIReprojected, 10);
Map.addLayer(LearnGeographyGISrsWithAIReprojected, {color: 'blue'}, 'Study Area');

// Visualize NDVI
var ndviVis = {min: -0.9370114021622574, max: 0.38831817077039277, palette: ['ff0000','d7a425','37ab3e','fff43c','0d2505']};
Map.addLayer(modisWithNDVI.select('NDVI'), ndviVis, 'NDVI');

// Visualize predicted crop yield
var cropYieldVis = {min: 0.26893767441860467, max: 0.697946046511628, palette: ['ff0000','ffd758','37ab3e','53ff30','185a1f']};
Map.addLayer(cropYieldWithMean, cropYieldVis, 'Predicted Crop Yield');


///////////////////////////////////
// Create legend for predicted crop yield
var legendCropYield = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 15px'
  }
});

// Create legend title
var legendTitle = ui.Label({
  value: 'Predicted Crop Yield',
  style: {
    fontWeight: 'bold',
    fontSize: '18px',
    margin: '0 0 4px 0',
    padding: '0'
  }
});
legendCropYield.add(legendTitle);

// Create the color palette for the legend
var palette = ['ff0000', 'ffd758', '37ab3e', '53ff30', '185a1f'];
var min = 0.26893767441860467;
var max = 0.697946046511628;
var numClasses = palette.length;

// Labels with RGB codes for each color
var labels = [
  {class: 0, color: '#ff0000', rgb: 'RGB: 255, 0, 0'},
  {class: 1, color: '#ffd758', rgb: 'RGB: 255, 215, 88'},
  {class: 2, color: '#37ab3e', rgb: 'RGB: 55, 171, 62'},
  {class: 3, color: '#53ff30', rgb: 'RGB: 83, 255, 48'},
  {class: 4, color: '#185a1f', rgb: 'RGB: 24, 90, 31'}
];

// Create labels for the legend
for (var i = 0; i < numClasses; i++) {
  var color = palette[i];
  var label = ui.Label({
    style: {
      backgroundColor: '#' + color,
      padding: '8px',
      margin: '0 0 4px 0'
    }
  });

  // Set the legend label's min and max values
  var step = (max - min) / numClasses;
  var lowerBound = min + (step * i);
  var upperBound = min + (step * (i + 1));
  label.setValue(upperBound.toFixed(2) + (i === numClasses - 1 ? '+' : '') + ' (RGB: ' + labels[i].rgb + ')');
  legendCropYield.add(label);
}

// Add legend to the Map
Map.add(legendCropYield);

// Visualize predicted crop yield with a color palette
var cropYieldVis = {
  min: 0.26893767441860467,
  max: 0.697946046511628,
  palette: ['ff0000', 'ffd758', '37ab3e', '53ff30', '185a1f']
};

// Export the predicted crop yield image as TIFF
Export.image.toDrive({
  image: cropYieldWithMean,
  description: 'predicted_crop_yield_image',
  folder: 'Learn Geography GIS RS Wth AI',
  fileNamePrefix: 'predicted_crop_yield',
  scale: 500,  // Resolution in meters
  region: LearnGeographyGISrsWithAIReprojected,
  maxPixels: 1e13
});
