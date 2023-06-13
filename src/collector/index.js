const utils = require("./utils");
const babelUtils = require("../babel-plugin/utils");
const path = require("path");
const ora = require("ora");
const fs = require("fs");
const myOra = ora();
const translate = require("./translate");

/**
 *
 * @param options
 */
function genConfigFile(opt) {
  let options = {
    i18nDir: utils.defaultDir(),
    ...opt,
  };
  myOra.info("国际化配置生成中...");
  let i18nMap = babelUtils.getI18nMap(),
    oldKeysMap = {};
  let localeFilePath = path.resolve(options.i18nDir, "./zh_CN/index.js");
  if (fs.existsSync(localeFilePath)) {
    oldKeysMap = require(localeFilePath);
  }
  let oldKeysMapKeys = Object.keys(oldKeysMap);
  let textKeyArr = [],
    newTextKeyArr = [],
    sortKeysMap = {};
  Object.keys(i18nMap).map((key) => {
    if (oldKeysMapKeys.length && !oldKeysMap[key]) {
      newTextKeyArr.push(key);
    } else {
      textKeyArr.push(key);
    }
  });
  if (oldKeysMapKeys.length) {
    textKeyArr.sort((a, b) => {
      return oldKeysMapKeys.indexOf(a) - oldKeysMapKeys.indexOf(b);
    });
  }
  textKeyArr.concat(newTextKeyArr).forEach((key) => {
    sortKeysMap[key] = i18nMap[key];
  });

  let localeCode = "module.exports = " + JSON.stringify(sortKeysMap);
  utils.writeFile(path.resolve(options.i18nDir, "./zh_CN/index.js"), localeCode);

  translate(options,sortKeysMap);
}

/**
 *
 * @type {genConfigFile}
 */
module.exports = genConfigFile;
module.exports.utils = utils;
