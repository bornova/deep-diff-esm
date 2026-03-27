/**
 * Generates a hash for a given string.
 * @param {string} string - The string to hash.
 * @returns {number} - The hash of the string.
 */
function hashThisString(string) {
  let hash = 0

  for (let i = 0; i < string.length; i++) {
    hash = (hash << 5) - hash + string.charCodeAt(i)
    hash |= 0 // Convert to 32bit integer
  }

  return hash
}

/**
 * Removes a single element from an array at the given index.
 * @param {Array} arr - The array to remove the element from.
 * @param {number} from - The non-negative index of the element to remove.
 * @returns {Array} - The modified array.
 */
export function arrayRemove(arr, from) {
  arr.splice(from, 1)
  return arr
}

/**
 * Determines the real type of a given subject.
 * @param {*} subject - The subject to determine the type of.
 * @returns {string} - The real type of the subject.
 */
export function realTypeOf(subject) {
  const type = typeof subject

  if (type !== 'object') return type
  if (subject === null) return 'null'
  if (subject === Math) return 'math'
  if (Array.isArray(subject)) return 'array'

  const toString = Object.prototype.toString.call(subject)

  if (toString === '[object Date]') return 'date'
  if (toString === '[object RegExp]') return 'regexp'

  return 'object'
}

/**
 * Generates an order-independent hash for a given object.
 * @param {*} object - The object to hash.
 * @param {WeakSet} [seen] - WeakSet of seen objects to prevent circular loops.
 * @returns {number} - The order-independent hash of the object.
 */
export function getOrderIndependentHash(object, seen = new WeakSet()) {
  let accum = 0

  const type = realTypeOf(object)

  if (type === 'array') {
    if (seen.has(object)) return 0
    seen.add(object)

    for (const item of object) {
      accum += getOrderIndependentHash(item, seen)
    }

    return accum + hashThisString(`[type: array, hash: ${accum}]`)
  }

  if (type === 'object') {
    if (seen.has(object)) return 0
    seen.add(object)

    for (const key of Object.keys(object)) {
      accum += hashThisString(
        `[ type: object, key: ${key}, value hash: ${getOrderIndependentHash(object[key], seen)} ]`
      )
    }

    return accum
  }

  return accum + hashThisString(`[ type: ${type} ; value: ${object} ]`)
}
