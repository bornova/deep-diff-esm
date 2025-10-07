import { observableDiff } from './deepDiff.js'
import { arrayRemove } from './utils.js'

/**
 * Applies a change to an array.
 * @param {Array} arr - The array to apply the change to.
 * @param {number} index - The index to apply the change at.
 * @param {Object} change - The change to apply.
 * @returns {Array} - The modified array.
 */
function applyArrayChange(arr, index, change) {
  if (change.path && change.path.length) {
    let it = arr[index]

    const i = change.path.length - 1
    const u = change.path.length - 1

    for (let i = 0; i < u; i++) {
      it = it[change.path[i]]
    }

    switch (change.kind) {
      case 'A':
        applyArrayChange(it[change.path[i]], change.index, change.item)
        break
      case 'D':
        delete it[change.path[i]]
        break
      case 'E':
      case 'N':
        it[change.path[i]] = change.rhs
        break
    }
  } else {
    switch (change.kind) {
      case 'A':
        applyArrayChange(arr[index], change.index, change.item)
        break
      case 'D':
        arr = arrayRemove(arr, index)
        break
      case 'E':
      case 'N':
        arr[index] = change.rhs
        break
    }
  }

  return arr
}

/**
 * Reverts a change to an array.
 * @param {Array} arr - The array to revert the change on.
 * @param {number} index - The index to revert the change at.
 * @param {Object} change - The change to revert.
 * @returns {Array} - The modified array.
 */
function revertArrayChange(arr, index, change) {
  if (change.path && change.path.length) {
    let it = arr[index]

    const i = change.path.length - 1
    const u = change.path.length - 1

    for (let i = 0; i < u; i++) {
      it = it[change.path[i]]
    }

    switch (change.kind) {
      case 'A':
        revertArrayChange(it[change.path[i]], change.index, change.item)
        break
      case 'D':
        it[change.path[i]] = change.lhs
        break
      case 'E':
        it[change.path[i]] = change.lhs
        break
      case 'N':
        delete it[change.path[i]]
        break
    }
  } else {
    switch (change.kind) {
      case 'A':
        revertArrayChange(arr[index], change.index, change.item)
        break
      case 'D':
        arr[index] = change.lhs
        break
      case 'E':
        arr[index] = change.lhs
        break
      case 'N':
        arr = arrayRemove(arr, index)
        break
    }
  }

  return arr
}

/**
 * Applies a change to an object.
 * @param {Object} target - The target object.
 * @param {Object} source - The source object.
 * @param {Object} change - The change to apply.
 */
export function applyChange(target, source, change) {
  const validKinds = ['N', 'E', 'A', 'D']

  if (typeof change === 'undefined' && source && validKinds.includes(source.kind)) {
    change = source
  }

  if (target && change && change.kind) {
    let it = target
    let i = -1

    const last = change.path ? change.path.length - 1 : 0

    while (++i < last) {
      if (typeof it[change.path[i]] === 'undefined') {
        it[change.path[i]] =
          typeof change.path[i + 1] !== 'undefined' && typeof change.path[i + 1] === 'number' ? [] : {}
      }

      it = it[change.path[i]]
    }

    switch (change.kind) {
      case 'A':
        if (change.path && typeof it[change.path[i]] === 'undefined') {
          it[change.path[i]] = []
        }

        applyArrayChange(change.path ? it[change.path[i]] : it, change.index, change.item)
        break
      case 'D':
        delete it[change.path[i]]
        break
      case 'E':
      case 'N':
        it[change.path[i]] = change.rhs
        break
    }
  }
}

/**
 * Applies differences between two objects.
 * @param {Object} target - The target object.
 * @param {Object} source - The source object.
 * @param {Function} [filter] - A function to filter changes.
 */
export function applyDiff(target, source, filter) {
  if (target && source) {
    const onChange = (change) => {
      if (!filter || filter(target, source, change)) {
        applyChange(target, source, change)
      }
    }

    observableDiff(target, source, onChange)
  }
}

/**
 * Reverts a change to an object.
 * @param {Object} target - The target object.
 * @param {Object} source - The source object.
 * @param {Object} change - The change to revert.
 */
export function revertChange(target, source, change) {
  if (target && source && change && change.kind) {
    let it = target

    const i = change.path.length - 1
    const u = change.path.length - 1

    for (let i = 0; i < u; i++) {
      if (typeof it[change.path[i]] === 'undefined') {
        it[change.path[i]] = {}
      }

      it = it[change.path[i]]
    }

    switch (change.kind) {
      case 'A':
        revertArrayChange(it[change.path[i]], change.index, change.item)
        break
      case 'D':
        it[change.path[i]] = change.lhs
        break
      case 'E':
        it[change.path[i]] = change.lhs
        break
      case 'N':
        delete it[change.path[i]]
        break
    }
  }
}
