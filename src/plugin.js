const path = require("path");
const collector = require("./collector");
const i18nUtils = require("./babel-plugin/utils");
const ConcatSource = require("webpack-sources").ConcatSource;
// const polyfilePath = require.resolve("./collector/polyfill.js");
const polyfilePath = path.resolve(__dirname, "./collector/polyfill.mjs");
class i18nPlugin {
  constructor(config) {
    this.i18nConfig = config;
    process.env.i18nOptions = JSON.stringify(config)
  }
  apply(compiler) {
    
    // 编译之前删除缓存，避免读取缓存数据
    collector.utils.deleteCacheFolder();
    
    let entries = compiler.options.entry;
    let newEntries = {};

    // entry添加polyfill
    Object.keys(entries).forEach((key) => {
      let entry = entries[key];
      if (typeof entry == "string") {
        newEntries[key] = [polyfilePath, entries[key]];
      } else if (Array.isArray(entry)) {
        entry.unshift(polyfilePath);
        newEntries[key] = entry;
      } else if (entry.import) {
        if (typeof entry.import === "string") {
          entry.import = [polyfilePath, entry.import];
          newEntries[key] = entry;
        } else if (Array.isArray(entry.import)) {
          entry.import.unshift(polyfilePath);
          newEntries[key] = entry;
        }
      }
    });
    compiler.options.entry = newEntries;

    // 通过pitcher修改loader
    let rules = (compiler.options.module || {}).rules;
    let pitchIndex, prePitcher;
    rules.forEach((item, index) => {
      if (!prePitcher && /vue-loader/.test(item.loader) && /pitcher/.test(item.loader) && !/i18pitcher/.test(item.loader)) {
        pitchIndex = index;
        prePitcher = item;
      }
    });
    rules.push({
      test: /\.(js|ts|tsx)$/,
      exclude: /node_modules|i18n/,
      include: /src/,
      loader: path.resolve(__dirname, './loader/index.js')
    })
    if (prePitcher) {
      let i18nPitcher = {
        ...prePitcher,
        loader: path.resolve(__dirname, "./loader/i18pitcher.js"),
        resourceQuery: prePitcher.resourceQuery,
        options: {
          ...prePitcher.options,
          prePitcher,
        },
      };
      rules.splice(pitchIndex, 1, i18nPitcher);
      (compiler.options.module || {}).rules = rules;
    }

    // 收集国际化信息，并生成对应的文件
    let versionRe = /\$\{i18n_locale_language_version\}/g;
    const tapMethod = this.i18nConfig.isSync === false ? "tap" : "tapAsync"
    compiler.hooks.emit[tapMethod]("i18nPlugin", (compilation, callback) => {
      if (this.i18nConfig.makefile !== false) {
        const promise = collector(this.i18nConfig);
        if(this.i18nConfig.isSync !== false) {
          promise.then(() => {
            callback();
          })
        }
      }

      // 生成国际化版本号，适用于语言包缓存等
      let i18nMap = i18nUtils.getI18nMap();
      let version = i18nUtils.genUuidKey(JSON.stringify(i18nMap), "v_");
      Object.keys(compilation.assets).forEach((assetName) => {
        if (/\.js$/.test(assetName)) {
          let content = compilation.assets[assetName].source();
          if (typeof content === "string" && versionRe.test(content)) {
            content = content.replace(versionRe, version);
            compilation.assets[assetName] = new ConcatSource(content);
          }
        }
      });
    });
    // 输出国际化结果信息
    compiler.hooks.done[tapMethod]("i18nPlugin", (stats, callback) => {
      if (this.i18nConfig.makefile !== false) {
        collector.utils.printUndo(this.i18nConfig);
      }
      if(this.i18nConfig.isSync !== false) {
          callback();
      }
    });
  }
}
module.exports = i18nPlugin;
