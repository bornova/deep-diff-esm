import { observableDiff } from './diff.js'
import { arrayRemove } from './utils.js'

/**
 * Applies a change to an array.
 * @param {Array} arr - The array to apply the change to.
 * @param {number} index - The index to apply the change at.
 * @param {Object} change - The change to apply.
 * @returns {Array} - The modified array.
 */
function applyArrayChange(arr, index, change) {
  if (change.path?.length) {
    let it = arr[index]

    const i = change.path.length - 1

    for (let j = 0; j < i; j++) {
      it = it[change.path[j]]
    }

    const lastKey = change.path[i]

    switch (change.kind) {
      case 'A':
        applyArrayChange(it[lastKey], change.index, change.item)
        break
      case 'D':
        delete it[lastKey]
        break
      case 'E':
      case 'N':
        it[lastKey] = change.rhs
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
  if (change.path?.length) {
    let it = arr[index]

    const i = change.path.length - 1

    for (let j = 0; j < i; j++) {
      it = it[change.path[j]]
    }

    const lastKey = change.path[i]

    switch (change.kind) {
      case 'A':
        revertArrayChange(it[lastKey], change.index, change.item)
        break
      case 'D':
      case 'E':
        it[lastKey] = change.lhs
        break
      case 'N':
        delete it[lastKey]
        break
    }
  } else {
    switch (change.kind) {
      case 'A':
        revertArrayChange(arr[index], change.index, change.item)
        break
      case 'D':
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

  if (target && change?.kind) {
    let it = target
    const path = change.path

    if (path) {
      const last = path.length - 1

      for (let i = 0; i < last; i++) {
        const key = path[i]

        if (typeof it[key] === 'undefined') {
          it[key] = typeof path[i + 1] === 'number' ? [] : {}
        }

        it = it[key]
      }

      const lastKey = path[last]

      switch (change.kind) {
        case 'A':
          if (typeof it[lastKey] === 'undefined') {
            it[lastKey] = []
          }

          applyArrayChange(it[lastKey], change.index, change.item)
          break
        case 'D':
          delete it[lastKey]
          break
        case 'E':
        case 'N':
          it[lastKey] = change.rhs
          break
      }
    } else {
      if (change.kind === 'A') {
        applyArrayChange(it, change.index, change.item)
      }
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
  if (target && source && change?.kind) {
    let it = target
    const path = change.path

    if (path) {
      const last = path.length - 1

      for (let j = 0; j < last; j++) {
        const key = path[j]

        if (typeof it[key] === 'undefined') {
          it[key] = typeof path[j + 1] === 'number' ? [] : {}
        }

        it = it[key]
      }

      const lastKey = path[last]

      switch (change.kind) {
        case 'A':
          revertArrayChange(it[lastKey], change.index, change.item)
          break
        case 'D':
        case 'E':
          it[lastKey] = change.lhs
          break
        case 'N':
          delete it[lastKey]
          break
      }
    } else {
      if (change.kind === 'A') {
        revertArrayChange(it, change.index, change.item)
      }
    }
  }
}
