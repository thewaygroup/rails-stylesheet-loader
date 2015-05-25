var fs = require('fs');
var path = require('path');

var ASSET_ROOTS = ['app/assets', 'lib/assets', 'vendor/assets'];
var ASSET_TYPES = ['fonts', 'images', 'javascripts', 'stylesheets'];

function isArray(value) {
  return value && value.constructor === Array;
}

function compact(arr) {
  return arr.filter(function (v) { return !!v; });
}

function flatten(arr, output) {
  if (!isArray(arr)) {
    return arr;
  }

  output = output || [];
  arr.forEach(function (item) {
    if (isArray(item)) {
      output = output.concat(flatten(item));
    } else {
      output.push(item);
    }
  });

  return output;
}


function findAssetFile(assetPath) {
  var filePaths = ASSET_ROOTS.map(function (assetRoot) {
    return ASSET_TYPES.map(function (assetType) {
      var filePath = path.resolve('.', assetRoot, assetType, assetPath);
      try {
        var fileStat = fs.statSync(filePath);
        return fileStat.isFile() ? filePath : null;
      } catch (err) {
        return null;
      }
    });
  });

  return compact(flatten(filePaths));
}

function urlReplacer(url) {
  var resultPath = url;
  var cleanUrl = url.replace(/^asset\-url\([\'\"]|[\'\"]\)$/g, '');
  var validPaths = findAssetFile(cleanUrl);
  if (validPaths.length > 0) {
    resultPath = validPaths[0];
    resultPath = path.relative(this.context, resultPath);
  }

  return 'url(\'' + resultPath + '\')';
}


function replaceAssetUrls(input, callback) {
  var output = String(input);
  var matches = input.match(/asset\-url\(([^\)]+)\)/g);

  if (!matches) {
    return output;
  }

  matches
    .forEach(function (match) {
      var replacement = urlReplacer.call(this, match);
      output = output.replace(match, replacement);
    }.bind(this));

  callback(output);
}

module.exports = function (content, map) {
  if (this.cacheable) {
    this.cacheable();
  }

  var callback = this.async();
  replaceAssetUrls.call(this, content, function (result) {
    callback(null, result, map);
  });
};
