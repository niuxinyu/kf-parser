/**
 * 操作符列表
 */

define(function (require) {
  var scriptHandler = require("impl/latex/handler/script")
  var TYPE = require("impl/latex/define/type")

  return {
    // 上标
    "^": {
      name: "superscript",
      type: TYPE.OP,
      handler: scriptHandler,
    },
    // 下标
    _: {
      name: "subscript",
      type: TYPE.OP,
      handler: scriptHandler,
    },
    // 分数
    frac: {
      name: "fraction",
      type: TYPE.FN,
      sign: false,
      handler: require("impl/latex/handler/fraction"),
    },
    // 根号
    sqrt: {
      name: "radical",
      type: TYPE.FN,
      sign: false,
      handler: require("impl/latex/handler/sqrt"),
    },
    // 加号
    sum: {
      name: "summation",
      type: TYPE.FN,
      traversal: "rtl",
      handler: require("impl/latex/handler/summation"),
    },
    // 积分
    int: {
      name: "integration",
      type: TYPE.FN,
      traversal: "rtl",
      handler: require("impl/latex/handler/integration"),
    },
    // 括号
    brackets: {
      name: "brackets",
      type: TYPE.FN,
      handler: require("impl/latex/handler/brackets"),
    },
    // 手写体
    mathcal: {
      name: "mathcal",
      type: TYPE.FN,
      sign: false,
      handler: require("impl/latex/handler/mathcal"),
    },
    // 花体
    mathfrak: {
      name: "mathfrak",
      type: TYPE.FN,
      sign: false,
      handler: require("impl/latex/handler/mathfrak"),
    },
    // 双线
    mathbb: {
      name: "mathbb",
      type: TYPE.FN,
      sign: false,
      handler: require("impl/latex/handler/mathbb"),
    },
    // 罗马
    mathrm: {
      name: "mathrm",
      type: TYPE.FN,
      sign: false,
      handler: require("impl/latex/handler/mathrm"),
    },
    // 上下结构
    // 类似于分数
    xleftarrow: {
      name: "xleftarrow",
      type: TYPE.FN,
      sign: false,
      handler: require("impl/latex/handler/sqrt"),
    },
  }
})
