/**
 * Kity Formula Latex解析器实现
 */
/* jshint forin: false */

// 非文本节点没有总到 new Text 内
// 而是有自己的单独实现

define(function (require) {
  var Parser = require("parser").Parser
  var LatexUtils = require("impl/latex/base/latex-utils")
  var PRE_HANDLER = require("impl/latex/define/pre")
  var serialization = require("impl/latex/serialization")
  var OP_DEFINE = require("impl/latex/define/operator")
  var REVERSE_DEFINE = require("impl/latex/define/reverse")
  var SPECIAL_LIST = require("impl/latex/define/special")
  var Utils = require("impl/latex/base/utils")

  // data
  var leftChar = "\ufff8"
  var rightChar = "\ufffc"
  var clearCharPattern = new RegExp(leftChar + "|" + rightChar, "g")
  var leftCharPattern = new RegExp(leftChar, "g")
  var rightCharPattern = new RegExp(rightChar, "g")

  // latex 解析器
  Parser.register(
    "latex",
    Parser.implement({
      parse: function (data) {
        var units = this.split(this.format(data))

        // 分组
        units = this.parseToGroup(units)

        units = this.parseToStruct(units)

        // 生成树结构
        return this.generateTree(units)
      },

      serialization: function (tree, options) {
        return serialization(tree, options)
      },

      expand: function (expandObj) {
        var parseObj = expandObj.parse,
          formatKey = null,
          preObj = expandObj.pre,
          reverseObj = expandObj.reverse

        for (var key in parseObj) {
          if (!parseObj.hasOwnProperty(key)) {
            continue
          }

          formatKey = key.replace(/\\/g, "")

          OP_DEFINE[formatKey] = parseObj[key]
        }

        for (var key in reverseObj) {
          if (!reverseObj.hasOwnProperty(key)) {
            continue
          }

          REVERSE_DEFINE[key.replace(/\\/g, "")] = reverseObj[key]
        }

        // 预处理
        if (preObj) {
          for (var key in preObj) {
            if (!preObj.hasOwnProperty(key)) {
              continue
            }

            PRE_HANDLER[key.replace(/\\/g, "")] = preObj[key]
          }
        }
      },

      // 格式化输入数据
      format: function (input) {
        // 清理多余的空格
        input = clearEmpty(input)

        // 处理输入的“{”和“}”
        input = input
          .replace(clearCharPattern, "")
          .replace(/\\{/gi, leftChar)
          .replace(/\\}/gi, rightChar)

        // 预处理器处理
        for (var key in PRE_HANDLER) {
          if (PRE_HANDLER.hasOwnProperty(key)) {
            input = PRE_HANDLER[key](input)
          }
        }

        return input
      },

      // TODO
      split: function (data) {
        var units = []
        var pattern =
          /(?:\\[^a-z]\s*)|(?:\\[a-z]+\s*)|(?:[{}]\s*)|(?:[^\\{}]\s*)/gi
        var emptyPattern = /^\s+|\s+$/g
        var match = null

        data = data.replace(emptyPattern, "")

        while ((match = pattern.exec(data))) {
          match = match[0].replace(emptyPattern, "")
          if (match) {
            units.push(match)
          }
        }

        return units
      },

      /**
       * 根据解析出来的语法单元生成树
       * @param units 单元
       * @return 生成的树对象
       */
      generateTree: function (units) {
        var tree = []
        var currentUnit = null

        // 递归处理
        while ((currentUnit = units.shift())) {
          if (Utils.isArray(currentUnit)) {
            tree.push(this.generateTree(currentUnit))
          } else {
            tree.push(currentUnit)
          }
        }

        tree = LatexUtils.toRPNExpression(tree)

        const res = LatexUtils.generateTree(tree)

        console.log("处理之后的 tree", res)

        return res

        // return LatexUtils.generateTree(tree);
      },

      // 将传入值处理为 group
      parseToGroup: function (units) {
        var group = []
        var groupStack = [group]
        var groupCount = 0
        var bracketsCount = 0

        // 按照大括号和 \left 标识分组
        for (var i = 0, len = units.length; i < len; i++) {
          switch (units[i]) {
            case "{":
              groupCount++
              groupStack.push(group)
              group.push([])
              group = group[group.length - 1]
              break
            case "}":
              groupCount--
              group = groupStack.pop()
              break
            // left-right分组
            case "\\left":
              bracketsCount++
              groupStack.push(group)
              // 进入两层
              group.push([[]])
              group = group[group.length - 1][0]
              group.type = "brackets"
              // 读取左括号
              i++
              group.leftBrackets = units[i]
                .replace(leftCharPattern, "{")
                .replace(rightCharPattern, "}")
              break
            case "\\right":
              bracketsCount--
              // 读取右括号
              i++
              group.rightBrackets = units[i]
                .replace(leftCharPattern, "{")
                .replace(rightCharPattern, "}")
              group = groupStack.pop()
              break
            default:
              group.push(
                units[i]
                  .replace(leftCharPattern, "\\{")
                  .replace(rightCharPattern, "\\}")
              )
              break
          }
        }

        if (groupCount !== 0) {
          throw new Error("Group Error!")
        }

        if (bracketsCount !== 0) {
          throw new Error("Brackets Error!")
        }

        return groupStack[0]
      },

      parseToStruct: function (units) {
        var structs = []
        for (var i = 0, len = units.length; i < len; i++) {
          if (Utils.isArray(units[i])) {
            if (units[i].type === "brackets") {
              // 处理自动调整大小的括号组
              // 获取括号组定义
              structs.push(
                Utils.getBracketsDefine(
                  units[i].leftBrackets,
                  units[i].rightBrackets
                )
              )
              // 处理内部表达式
              structs.push(this.parseToStruct(units[i]))
            } else {
              // 普通组
              structs.push(this.parseToStruct(units[i]))
            }
          } else {
            structs.push(parseStruct(units[i]))
          }
        }

        return structs
      },
    })
  )

  // 应该不需要其他的解析器
  /**
   * 把序列化的字符串表示法转化为中间格式的结构化表示
   */
  function parseStruct(str) {
    // 特殊控制字符优先处理
    if (isSpecialCharacter(str)) {
      return str.substring(1)
    }
    switch (Utils.getLatexType(str)) {
      case "operator":
        return Utils.getDefine(str)
      case "function":
        return Utils.getFuncDefine(str)
      default:
        // text
        return transformSpecialCharacters(str)
    }
  }

  // 转换特殊的文本字符
  function transformSpecialCharacters(char) {
    if (char.indexOf("\\") === 0) {
      return char + "\\"
    }

    return char
  }

  function isSpecialCharacter(char) {
    if (char.indexOf("\\") === 0) {
      return !!SPECIAL_LIST[char.substring(1)]
    }

    return false
  }

  function clearEmpty(data) {
    return data
      .replace(/\\\s+/, "")
      .replace(/\s*([^a-z0-9\s])\s*/gi, function (match, symbol) {
        return symbol
      })
  }
})
