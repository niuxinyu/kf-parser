/*!
 * 分数函数处理器
 */

define(function () {
  // 处理函数接口
  return function (info, processedStack, unprocessedStack) {
    // 分子
    var numerator = unprocessedStack.shift()
    // 分母
    var denominator = unprocessedStack.shift()

    if (numerator === undefined || denominator === undefined) {
      throw new Error("Frac: Syntax Error")
    }

    info.operand = [numerator, denominator]

    delete info.handler

    return info
  }
})
