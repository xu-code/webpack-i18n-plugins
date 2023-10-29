const utils = require("./utils");
const XLSX = require("xlsx");
const path = require("path");
const ora = require("ora");
const myOra = ora();
const fs = require("fs");
const fileObjCache = {}
const autoTranslate = require('./autoTranslate')
/**
 *
 * @param options
 * @param sortKeysMap
 */
function writeJson (path, data) {
  const content = JSON.stringify(data, null, 4);
  utils.writeFile(path, content)
}
// 兼容旧版本(获取旧版本中excel的数据)
function getXlsxData(options) {
  let sourceFiles, xlsxData = []
  if (Array.isArray(options)) {
    sourceFiles = options
  } else {
    sourceFiles = options.sourceFiles
  }
  (sourceFiles || []).forEach((path) => {
    try {
      let workbook = XLSX.readFile(path);
      workbook.SheetNames.forEach((name) => {
        let sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[name]);
        sheetData.forEach((item) => {
          item.text = String(item.text || "").replace(/(<\/?)\s*([a-zA-z]+)\s*(>)/g, "$1$2$3"); //移除标签空格
        });
        xlsxData = [...xlsxData, ...sheetData]
        // 删除掉excel
        utils.deleteFile(path)
      });
    } catch (e) {
      myOra.fail(e.message);
    }
  });
  return xlsxData
}
function getJsonHashMap (json) {
  const hashMap = {}
  json.forEach(item => {
    hashMap[item.key] = item.text
  })
  return hashMap
}
function getTranslate (data, tranKey) {
  myOra.start('正在尝试自动翻译，初次执行时间较久，请耐心等待...')
  return new Promise((reslove, reject) => {
    autoTranslate(data, tranKey).then(list => {
      myOra.succeed("翻译成功(●'◡'●)!!!")
      reslove(list)
    }).catch(({error, list})=> {
      myOra.fail('翻译失败~(ಥ_ಥ)~,请尝试在对应目录下的json文件中对未翻译文本手动翻译！')
      myOra.fail(error.message)
      reslove(list)
    })
  })
}
module.exports = function translate(options, sortKeysMap, reslove) {
  const translation = options.translation || {}
  Object.keys(options.translation || {}).forEach((tranKey) => {
    let langOpt = translation[tranKey]
    const xlsxData = getXlsxData(langOpt, tranKey)
    // 如果存在xlsxData：写入到json中
    const localePath = path.resolve(options.i18nDir, "./" + tranKey + "/locale.json")
    const sourceJsonPath = langOpt.sourceJson || path.resolve(options.i18nDir, "./" + tranKey + "/index.json")
    if (xlsxData && xlsxData.length) {
      writeJson(localePath, xlsxData)
      writeJson(sourceJsonPath, xlsxData)
    }
    const localeJson = require(localePath)
    let newLocaleJson = []
    const sourceJson = require(sourceJsonPath)
    const localeResult = getJsonHashMap(localeJson) // 已翻译
    const toBeTranslate = [] // 待翻译
    Object.keys(sortKeysMap).forEach(key => {
      if (!localeResult[key]) {
        toBeTranslate.push({
          key: key,
          cn: sortKeysMap[key],
          text: "",
        })
      }
    })
    if (!toBeTranslate.length) {
      myOra.succeed('太棒啦！没有需要翻译的文本内容!!')
      reslove()
    } else {
      // 执行翻译
      getTranslate(toBeTranslate, tranKey).then(res => {
        const newRes = res.filter(item => {
          return !localeResult[item.key]
        })
        const filterLocal = localeJson.filter(item => item.text)
        newLocaleJson = [...filterLocal, ...newRes]
        writeTranslateFile()
        reslove()
      })
    }
    function writeTranslateFile() {
      // 对应翻译结果写入（语言包） /tranKey/index.js
      let outputJsPath = path.resolve(options.i18nDir, "./" + tranKey + "/index.js");
      // 对结果做缓存
      if (fs.existsSync(outputJsPath) && !fileObjCache[outputJsPath]) {
        fileObjCache[outputJsPath] = JSON.stringify(require(outputJsPath));
      }
      const newLocalHashMap = getJsonHashMap(newLocaleJson)
      const sourceHashMap = getJsonHashMap(sourceJson)
      for(let key in newLocalHashMap) {
        newLocalHashMap[key] = sourceHashMap[key] || newLocalHashMap[key]
      }
      // 译文格式化
      const indexJSData = JSON.stringify(utils.translateFormatter(newLocalHashMap, langOpt.formatter))
      // 内容有变化则重新写入
      if (fileObjCache[outputJsPath] !== indexJSData) {
        fileObjCache[outputJsPath] = indexJSData
        let localeCode = "module.exports = " + indexJSData;
        utils.writeFile(outputJsPath, localeCode);
      }
      // json内容如果有变化重新写入
      if(JSON.stringify(localeJson) !== JSON.stringify(newLocaleJson)) {
        writeJson(localePath, newLocaleJson)
      }
    }
  })
};
