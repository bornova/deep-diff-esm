/**
 * Generates a hash for a given string.
 * @param {string} string - The string to hash.
 * @returns {number} - The hash of the string.
 */
function hashThisString(string) {
  let hash = 0

  if (string.length === 0) {
    return hash
  }

  for (let i = 0; i < string.length; i++) {
    const char = string.charCodeAt(i)

    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }

  return hash
}

/**
 * Removes elements from an array.
 * @param {Array} arr - The array to remove elements from.
 * @param {number} from - The index to start removing from.
 * @param {number} [to] - The index to stop removing at.
 * @returns {Array} - The modified array.
 */
export function arrayRemove(arr, from, to) {
  const rest = arr.slice((to || from) + 1 || arr.length)

  arr.length = from < 0 ? arr.length + from : from
  arr.push(...rest)

  return arr
}

/**
 * Determines the real type of a given subject.
 * @param {*} subject - The subject to determine the type of.
 * @returns {string} - The real type of the subject.
 */
export function realTypeOf(subject) {
  const type = typeof subject

  if (type !== 'object') {
    return type
  }

  if (subject === Math) {
    return 'math'
  } else if (subject === null) {
    return 'null'
  } else if (Array.isArray(subject)) {
    return 'array'
  } else if (Object.prototype.toString.call(subject) === '[object Date]') {
    return 'date'
  } else if (typeof subject.toString === 'function' && /^\/.*\//.test(subject.toString())) {
    return 'regexp'
  }

  return 'object'
}

/**
 * Generates an order-independent hash for a given object.
 * @param {*} object - The object to hash.
 * @returns {number} - The order-independent hash of the object.
 */
export function getOrderIndependentHash(object) {
  let accum = 0

  const type = realTypeOf(object)

  if (type === 'array') {
    object.forEach((item) => {
      accum += getOrderIndependentHash(item)
    })

    const arrayString = `[type: array, hash: ${accum}]`

    return accum + hashThisString(arrayString)
  }

  if (type === 'object') {
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        const keyValueString = `[ type: object, key: ${key}, value hash: ${getOrderIndependentHash(object[key])} ]`

        accum += hashThisString(keyValueString)
      }
    }

    return accum
  }

  const stringToHash = `[ type: ${type} ; value: ${object} ]`

  return accum + hashThisString(stringToHash)
}
