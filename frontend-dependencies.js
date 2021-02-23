// Mappings for serving npm dependencies to the frontend; the keys are
// (virtual) locations as the frontend sees them, and the values are the
// locations of the files in the source tree.

// Mapping for file locations
module.exports.files = new Map([
  [
    "/vendor/jquery/jquery.min.js",
    "/node_modules/jquery/dist/jquery.min.js"
  ],
  [
    "/vendor/tilt/tilt.jquery.min.js",
    "/node_modules/tilt.js/dest/tilt.jquery.min.js"
  ],
  [
    "/vendor/animate/animate.min.css",
    "/node_modules/animate.css/animate.min.css"
  ],
  [
    "/vendor/d3/d3-array.min.js",
    "/node_modules/d3-array/dist/d3-array.min.js"
  ],
  [
    "/vendor/d3/d3-axis.min.js",
    "/node_modules/d3-axis/dist/d3-axis.min.js"
  ],
  [
    "/vendor/d3/d3-scale.min.js",
    "/node_modules/d3-scale/dist/d3-scale.min.js"
  ],
  // Begin dependencies of d3-scale
  [
    "/vendor/d3/d3-format.min.js",
    "/node_modules/d3-format/dist/d3-format.min.js"
  ],
  [
    "/vendor/d3/d3-interpolate.min.js",
    "/node_modules/d3-interpolate/dist/d3-interpolate.min.js"
  ],
  [
    "/vendor/d3/d3-time.min.js",
    "/node_modules/d3-time/dist/d3-time.min.js"
  ],
  [
    "/vendor/d3/d3-time-format.min.js",
    "/node_modules/d3-time-format/dist/d3-time-format.min.js"
  ],
  // End dependencies of d3-scale
  [
    "/vendor/d3/d3-selection.min.js",
    "/node_modules/d3-selection/dist/d3-selection.min.js"
  ],
  [
    "/vendor/d3/d3-boxplot.min.js",
    "/node_modules/d3-boxplot/build/d3-boxplot.min.js"
  ],
  [
    "/vendor/tabulator/tabulator.min.js",
    "/node_modules/tabulator-tables/dist/js/tabulator.min.js"
  ],
  [
    "/vendor/pdf.js/pdf.min.js",
    "/node_modules/pdfjs-dist/build/pdf.min.js"
  ],
  [
    "/vendor/pdf.js/pdf.worker.min.js",
    "/node_modules/pdfjs-dist/build/pdf.worker.min.js"
  ],
  [
    "/vendor/file-saver/FileSaver.min.js",
    "/node_modules/file-saver/dist/FileSaver.min.js"
  ],
  [
    "/vendor/file-saver/FileSaver.min.js.map",
    "/node_modules/file-saver/dist/FileSaver.min.js.map"
  ],
  [
    "/fonts/fontawesome/css/all.min.css",
    "/node_modules/@fortawesome/fontawesome-free/css/all.min.css"
  ],
]);

module.exports.directories = new Map([
  [
    "/fonts/fontawesome/webfonts",
    "/node_modules/@fortawesome/fontawesome-free/webfonts/"
  ],
  [
    "/fonts/material-icons/iconfont",
    "/node_modules/material-icons/iconfont/"
  ],
]);
