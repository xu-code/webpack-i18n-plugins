const babel = require("@babel/core")
const plugin = require("../babel-plugin")
const utils = require("../babel-plugin/utils")
const getOptions = require("../babel-plugin/utils").getOptions;
const path = require("path")
module.exports = function (source) {
  let i18nPath = getOptions('i18nDir') || path.resolve(process.cwd(), './i18n');
  let filePath = this.resourcePath
  if (utils.isChinese(source) && !filePath.includes(i18nPath)) {
    try {
      const tsOptions = getOptions('tsOptions')
      const tsPlugin = tsOptions ? ["@babel/plugin-transform-typescript", tsOptions] : "@babel/plugin-transform-typescript"
      let result = babel.transformSync(source, {
        configFile: false,
        plugins: [tsPlugin, plugin],
      });
      return result.code
    } catch (e) {
      console.error(e)
    }
  }
  return source
};
