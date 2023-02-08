/**
 * 获取元素节点的左边距
 * @param {Object} elementObj 元素节点
 * @param {Boolean} isRoot 是否获取当前元素相对于浏览器（html节点）的左边距
 */
export function getOffsetLeft (elementObj, isRoot = true) {
  let tmp = elementObj.offsetLeft
  if (isRoot) {
    let val = elementObj.offsetParent
    while (val != null) {
      tmp += val.offsetLeft
      val = val.offsetParent
    }
  }
  return tmp
}

/**
 * 获取元素节点距离浏览器的上边距
 * @param {Object} elementObj 元素节点
 *  * @param {Boolean} isRoot 是否获取当前元素相对于浏览器（html节点）的上边距
 */
export function getOffsetTop (elementObj, isRoot = true) {
  let tmp = elementObj.offsetTop
  if (isRoot) {
    let val = elementObj.offsetParent
    while (val != null) {
      tmp += val.offsetTop
      val = val.offsetParent
    }
  }
  return tmp
}
