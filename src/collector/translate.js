const utils = require("./utils");
const XLSX = require("xlsx");
const path = require("path");
const ora = require("ora");
const myOra = ora();
const fs = require("fs");
const autoTranslate = require('./autoTranslate')
/**
 *
 * @param options
 * @param oldKeysMap
 */
module.exports = function translate(options, oldKeysMap, newTextKeyArr, reslove) {
  let tranKeys = Object.keys(options.translation || {});
  if (tranKeys && tranKeys.length) {
    tranKeys.forEach((tranKey) => {
      let sourceFiles = options.translation[tranKey] || [];
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
                tempObj[item.key] = String(item.text || "").replace(/(<\/?)\s*([a-zA-z])+\s*(>)/g, "$1$2$3"); //移除标签空格
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
      let jsonData = {};
      let isTranslated = []
      Object.keys(oldKeysMap).map((key, index) => {
        if (translateObj[key]) {
          localeResult[key] = translateObj[key];
          isTranslated.push({
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
          jsonData[key] = oldKeysMap[key];
        }
      });
      if (!xlsxData.length) {
        writeTranslateFile(false)
        reslove()
        return
      }
      myOra.start('正在尝试自动翻译，初次执行时间较久，请耐心等待...')
      autoTranslate(xlsxData, tranKey).then(res => {
        res.forEach(item => {
          localeResult[item.key] = item.text
        })
        xlsxData = [...isTranslated, ...res]
        writeTranslateFile(true)
        myOra.succeed('翻译成功!!!')
        reslove()
      }).catch(err=> {
        writeTranslateFile(false)
        myOra.fail('翻译失败，请尝试手动翻译')
        reslove()
      })
      function writeTranslateFile(isTranslate) {
        let outputJsPath = path.resolve(options.i18nDir, "./" + tranKey + "/index.js");
        let oldLocaleResult;
        if (fs.existsSync(outputJsPath)) {
          oldLocaleResult = require(outputJsPath);
        }
        if (!oldLocaleResult || JSON.stringify(oldLocaleResult) !== JSON.stringify(localeResult)) {
          let localeCode = "module.exports = " + JSON.stringify(localeResult);
          utils.writeFile(outputJsPath, localeCode);
        }

        let outputXlsxPath = path.resolve(options.i18nDir, "./" + tranKey + (isTranslate? "/index.xlsx" : "/待翻译.xlsx"));
        isTranslate && utils.deleteFile(path.resolve(options.i18nDir, "./" + tranKey + "/待翻译.xlsx"));
        if (isTranslate || newTextKeyArr.length) {
          let buf = utils.genXLSXData(xlsxData);
          utils.writeFile(outputXlsxPath, buf);
          !isTranslate && utils.setUndoCount(tranKey, xlsxData.length);
        } else {
          utils.deleteFile(outputXlsxPath);
        }
      }
    });
  }
};
