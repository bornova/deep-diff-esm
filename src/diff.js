import { DiffArray, DiffDeleted, DiffEdit, DiffNew } from './models.js'
import { getOrderIndependentHash, realTypeOf } from './utils.js'

/**
 * Recursively finds differences between two objects.
 * @param {*} lhs - The left-hand side object.
 * @param {*} rhs - The right-hand side object.
 * @param {Array} [changes] - The array to accumulate changes.
 * @param {Function|Object} [prefilter] - A function or object to filter properties.
 * @param {Array} [path] - The current path of the diff.
 * @param {*} [key] - The current key being processed.
 * @param {Array} [stack] - The stack of objects being compared.
 * @param {boolean} [orderIndependent] - Whether to perform order-independent comparison.
 */
function deepDiff(lhs, rhs, changes = [], prefilter, path = [], key, stack = [], orderIndependent) {
  const currentPath = path.slice(0)

  if (typeof key !== 'undefined' && key !== null) {
    if (prefilter) {
      if (typeof prefilter === 'function' && prefilter(currentPath, key)) {
        return
      } else if (typeof prefilter === 'object') {
        if (prefilter.prefilter?.(currentPath, key)) {
          return
        }

        if (prefilter.normalize) {
          const alt = prefilter.normalize(currentPath, key, lhs, rhs)

          if (alt) {
            lhs = alt[0]
            rhs = alt[1]
          }
        }
      }
    }

    currentPath.push(key)
  }

  if (realTypeOf(lhs) === 'regexp' && realTypeOf(rhs) === 'regexp') {
    lhs = lhs.toString()
    rhs = rhs.toString()
  }

  const ltype = typeof lhs
  const rtype = typeof rhs

  const lastStack = stack.at(-1)

  const ldefined = ltype !== 'undefined' || (lastStack?.lhs && Object.getOwnPropertyDescriptor(lastStack.lhs, key))

  const rdefined = rtype !== 'undefined' || (lastStack?.rhs && Object.getOwnPropertyDescriptor(lastStack.rhs, key))

  if (!ldefined && rdefined) {
    changes.push(new DiffNew(currentPath, rhs))
  } else if (!rdefined && ldefined) {
    changes.push(new DiffDeleted(currentPath, lhs))
  } else if (realTypeOf(lhs) !== realTypeOf(rhs)) {
    changes.push(new DiffEdit(currentPath, lhs, rhs))
  } else if (realTypeOf(lhs) === 'date' && lhs - rhs !== 0) {
    changes.push(new DiffEdit(currentPath, lhs, rhs))
  } else if (ltype === 'object' && lhs !== null && rhs !== null) {
    const isCircular = stack.some((item) => item.lhs === lhs || item.rhs === rhs)

    if (!isCircular) {
      if (Array.isArray(lhs)) {
        stack.push({ lhs, rhs })

        if (orderIndependent) {
          lhs = [...lhs].sort((a, b) => getOrderIndependentHash(a) - getOrderIndependentHash(b))
          rhs = [...rhs].sort((a, b) => getOrderIndependentHash(a) - getOrderIndependentHash(b))
        }

        let i = rhs.length - 1
        let j = lhs.length - 1

        while (i > j) {
          changes.push(new DiffArray(currentPath, i, new DiffNew(undefined, rhs[i--])))
        }

        while (j > i) {
          changes.push(new DiffArray(currentPath, j, new DiffDeleted(undefined, lhs[j--])))
        }

        for (; i >= 0; --i) {
          deepDiff(lhs[i], rhs[i], changes, prefilter, currentPath, i, stack, orderIndependent)
        }
      } else {
        stack.push({ lhs, rhs })

        const akeys = Object.keys(lhs).concat(Object.getOwnPropertySymbols(lhs))
        const pkeys = Object.keys(rhs).concat(Object.getOwnPropertySymbols(rhs))

        for (const k of akeys) {
          const other = pkeys.indexOf(k)

          if (other >= 0) {
            deepDiff(lhs[k], rhs[k], changes, prefilter, currentPath, k, stack, orderIndependent)
            pkeys[other] = null
          } else {
            deepDiff(lhs[k], undefined, changes, prefilter, currentPath, k, stack, orderIndependent)
          }
        }

        for (const k of pkeys) {
          if (k !== null) {
            deepDiff(undefined, rhs[k], changes, prefilter, currentPath, k, stack, orderIndependent)
          }
        }
      }

      stack.pop()
    } else if (lhs !== rhs) {
      changes.push(new DiffEdit(currentPath, lhs, rhs))
    }
  } else if (lhs !== rhs) {
    if (!(ltype === 'number' && Number.isNaN(lhs) && Number.isNaN(rhs))) {
      changes.push(new DiffEdit(currentPath, lhs, rhs))
    }
  }
}

/**
 * Observes differences between two objects and notifies an observer.
 * @param {*} lhs - The left-hand side object.
 * @param {*} rhs - The right-hand side object.
 * @param {Function} observer - The observer function to notify of changes.
 * @param {Object} [options] - Options object.
 * @param {Function|Object} [options.prefilter] - A function or object to filter properties. If an object, it has 'prefilter' and 'normalize' properties where 'prefilter' is a function that determines whether difference analysis should continue down the object graph, and 'normalize' is a function that pre-processes every leaf of the tree.
 * @param {boolean} [options.orderIndependent] - Whether to perform order-independent comparison. Default is false.
 * @returns {Array} - The array of changes.
 */
export function observableDiff(lhs, rhs, observer, options = {}) {
  const { prefilter, orderIndependent } = options
  const changes = []

  deepDiff(lhs, rhs, changes, prefilter, undefined, undefined, undefined, orderIndependent)

  if (observer) {
    for (const change of changes) {
      observer(change)
    }
  }

  return changes
}

/**
 * Accumulates differences between two objects.
 * @param {*} lhs - The left-hand side object.
 * @param {*} rhs - The right-hand side object.
 * @param {Object} [options] - Options object.
 * @param {Function|Object} [options.prefilter] - A function or object to filter properties. If an object, it has 'prefilter' and 'normalize' properties where 'prefilter' is a function that determines whether difference analysis should continue down the object graph, and 'normalize' is a function that pre-processes every leaf of the tree.
 * @param {Array} [options.accumulator] - The array to accumulate changes.
 * @param {boolean} [options.orderIndependent] - Whether to perform order-independent comparison. Default is false.
 * @returns {Array|undefined} - The array of changes or undefined if no changes.
 */
export function diff(lhs, rhs, options = {}) {
  const { prefilter, accumulator, orderIndependent } = options

  const observer = accumulator
    ? (difference) => {
        accumulator.push(difference)
      }
    : undefined

  const changes = observableDiff(lhs, rhs, observer, { prefilter, orderIndependent })

  return accumulator ? accumulator : changes.length ? changes : undefined
}
