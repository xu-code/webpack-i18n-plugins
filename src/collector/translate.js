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
 * @param oldKeysMap
 */
module.exports = function translate(options, oldKeysMap, reslove) {
  let tranKeys = Object.keys(options.translation || {});
  if (tranKeys && tranKeys.length) {
    tranKeys.forEach((tranKey) => {
      const tranKeyItem = options.translation[tranKey] || {}
      let sourceFiles, formatter
      if (Array.isArray(tranKeyItem)) {
        sourceFiles = tranKeyItem
      } else {
        sourceFiles = tranKeyItem.sourceFiles
        formatter = tranKeyItem.formatter
      }
      if (sourceFiles && typeof sourceFiles === "string") {
        sourceFiles = [sourceFiles];
      }
      let translateObj = {};

      (sourceFiles || []).forEach((path) => {
        try {
          if (/\.js$/.test(path)) {
            let localObj = require(path);
            Object.assign(translateObj, localObj);
          } else {
            let workbook = XLSX.readFile(path);
            workbook.SheetNames.forEach((name) => {
              let sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[name]);
              let tempObj = {};
              sheetData.forEach((item) => {
                tempObj[item.key] = String(item.text || "").replace(/(<\/?)\s*([a-zA-z]+)\s*(>)/g, "$1$2$3"); //移除标签空格
              });
              Object.assign(translateObj, tempObj);
            });
          }
        } catch (e) {
          myOra.fail(e.message);
        }
      });

      let localeResult = {};
      let xlsxData = [];
      let translatedList = []
      Object.keys(oldKeysMap).map((key, index) => {
        if (translateObj[key]) {
          localeResult[key] = translateObj[key];
          translatedList.push({
            key: key,
            cn: oldKeysMap[key],
            text: translateObj[key]
          })
        } else {
          xlsxData.push({
            key: key,
            cn: oldKeysMap[key],
            text: "",
          });
                  }
      });
      if (!xlsxData.length) {
        myOra.succeed('太棒啦！没有需要翻译的文本内容!!')
        writeTranslateFile(false)
        reslove()
        return
      }
      myOra.start('正在尝试自动翻译，初次执行时间较久，请耐心等待...')
      autoTranslate(xlsxData, tranKey).then(res => {
        res.forEach(item => {
          localeResult[item.key] = item.text
        })
        xlsxData = [...translatedList, ...res]
        writeTranslateFile(true)
        myOra.succeed('翻译成功!!!')
        reslove()
      }).catch(err=> {
        writeTranslateFile(false)
        myOra.fail('翻译失败，请尝试在对应目录下的index.xlsx中对未翻译文本手动翻译！')
        myOra.fail(err.message)
        reslove()
      })
      /**
       * 判断翻译是否成功，从而决定应该写入哪个excel表
       * @param {boolean} isTranslate  
       */
      function writeTranslateFile(isTranslate) {
        // 对应翻译结果写入（语言包） /tranKey/index.js
        let outputJsPath = path.resolve(options.i18nDir, "./" + tranKey + "/index.js");
        if (fs.existsSync(outputJsPath) && !fileObjCache[outputJsPath]) {
          fileObjCache[outputJsPath] = JSON.stringify(require(outputJsPath));
        }
        const indexJSData = JSON.stringify(utils.translateFormatter(localeResult, formatter))
        // 内容有变化则重新写入
        if (fileObjCache[outputJsPath] !== indexJSData) {
          fileObjCache[outputJsPath] = indexJSData
          let localeCode = "module.exports = " + indexJSData;
          utils.writeFile(outputJsPath, localeCode);
        }
        // 翻译成功写入xlsx，翻译失败写入待翻译文件；
        const indexXlsx = path.resolve(options.i18nDir, "./" + tranKey + '/index.xlsx')
        const toBeTranslate = path.resolve(options.i18nDir, "./" + tranKey + '/待翻译.xlsx')
        const buf = utils.genXLSXData(xlsxData);
        if(isTranslate) {
          // 翻译成功，删除待翻译文件
          utils.deleteFile(toBeTranslate)
          // 写入内容到index.xlsx
          utils.writeFile(indexXlsx, buf);
        } else {
          if (fileObjCache[toBeTranslate] !== JSON.stringify(xlsxData)) {
            fileObjCache[toBeTranslate] = JSON.stringify(xlsxData)
            utils.writeFile(toBeTranslate, buf);
          }
          // 写入内容到index.xlsx
          const indexData = [...translatedList, ...xlsxData]
          if (fileObjCache[indexXlsx] !== JSON.stringify(indexData)) {
            fileObjCache[indexXlsx] = JSON.stringify(indexData)
            const indexBuf = utils.genXLSXData(indexData);
            utils.writeFile(indexXlsx, indexBuf);
          }
          utils.setUndoCount(tranKey, xlsxData.length);
        }
      }
    });
  }
};
