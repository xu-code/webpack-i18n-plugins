const options = require("./options");
const utils = require("./utils");
const types = require("@babel/types");
const babel = require("@babel/core");
const babelUtils = require("./utils");
const ora = require("ora");
const myOra = ora();

/**
 * 获取最终的 excludedCall 列表（默认配置 + 用户自定义配置）
 * 用户配置通过 process.env.i18nOptions 传递，字符串会转换为 RegExp，
 * 正则表达式则通过序列化后的 source 和 flags 恢复
 * @returns {RegExp[]}
 */
const getExcludedCall = function () {
  const userExcludedCall = utils.getOptions("excludedCall") || [];
  const userList = (Array.isArray(userExcludedCall) ? userExcludedCall : [userExcludedCall]).map((item) => {
    if (item instanceof RegExp) {
      return item;
    }
    try {
      if (typeof item === "string") {
        return new RegExp(item);
      }
      if (item && item.__webpackI18nRegExp === true && typeof item.source === "string") {
        return new RegExp(item.source, item.flags || "");
      }
      throw new TypeError("仅支持字符串或正则表达式");
    } catch (error) {
      myOra.warn("excludedCall 配置项 " + item + " 不是有效的正则表达式，已忽略");
      return null;
    }
  }).filter(Boolean);
  return options.excludedCall.concat(userList);
};

module.exports.StringLiteral = function (path) {
  let { node } = path;
  let excludedReg = new RegExp(options.excludedPattern);
  let value = node.value;

  if (utils.isChinese(value) && !excludedReg.test(value)) {
    let parentNode = path.parent;
    let callName = babelUtils.getCallExpressionName(parentNode);
    const isExclude = getExcludedCall().some(item => {
        return item.test(callName)
    })
    let ignoreExpression = types.isImportDeclaration(parentNode) || parentNode.key === node || (types.isCallExpression(parentNode) && isExclude);

    if (!ignoreExpression) {
      if (types.isJSXAttribute(parentNode)) {
        let expression = babelUtils.genAIExpression(node.value, true);
        let newNode = types.JSXExpressionContainer(expression);
        path.replaceWith(newNode);
      } else if (types.isObjectProperty(parentNode)) {
        let keyValue = utils.genUuidKey(node.value);
        let replaceNode = babelUtils.genAIExpression(value, true, keyValue);
        path.replaceWith(replaceNode);
      } else {
        let replaceNode = babelUtils.genAIExpression(value, true);
        path.replaceWith(replaceNode);
      }
    }
  }
};

module.exports.JSXText = function (path) {
  let { node } = path;
  let value = node.value;
  let excludedReg = new RegExp(options.excludedPattern);

  if (utils.isChinese(value) && !excludedReg.test(value)) {
    let expression = babelUtils.genAIExpression(value, true);
    let newNode = types.JSXExpressionContainer(expression);
    path.replaceWith(newNode);
  }
};
module.exports.TemplateElement = function (path) {
  let { node } = path;
  let value = node.value.raw || node.value.cooked;
  let excludedReg = new RegExp(options.excludedPattern);

  if (utils.isChinese(value) && !excludedReg.test(value)) {
    let parentNode = path.parent;
    // let callName = babelUtils.getCallExpressionName(parentNode);
    let callName = "";
    let parentPath = path.parentPath; // TemplateLiteral
    if (types.isTemplateLiteral(parentPath.node)) {
      let grandParentPath = parentPath.parentPath;
      // 检查是否在 CallExpression 的参数中
      if (types.isCallExpression(grandParentPath.node)) {
        callName = babelUtils.getCallExpressionName(grandParentPath.node);
      }
    }
    const isExclude = getExcludedCall().some(item => {
      return item.test(callName)
  })
    let ignoreExpression = types.isCallExpression(parentPath.parentPath.node) && isExclude;

    if (!ignoreExpression) {
      let tplStr = `\${${babelUtils.genAIExpression(value)}}`;
      node.value.raw = tplStr;
      node.value.cooked = tplStr;
    }
  }
};

module.exports.CallExpression = function (path) {
  let { node } = path;
  let parentNode = path.parent;
  if (node.callee.name === options.$i8n) {
    let arg = node.arguments || [];
    let uuidKey = (arg[0] || {}).value;

    if (!(uuidKey && arg[1] && types.isStringLiteral(arg[1]))) {
      let astProgram = types.program([types.expressionStatement(node)]);
      let fnCode = babel.transformFromAst(astProgram).code;
      myOra.warn("方法：" + fnCode + " 参数必须为字符串，请检查");
    } else {
      if (arg[1].value) {
        utils.collectKeys(uuidKey, arg[1].value);
      }
    }
  }
};
