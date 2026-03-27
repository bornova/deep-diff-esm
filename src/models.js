/**
 * Represents a generic Diff.
 * @class
 */
class Diff {
  /**
   * Creates an instance of Diff.
   * @param {string} kind - The kind of the diff.
   * @param {Array} path - The path of the diff.
   */
  constructor(kind, path) {
    this.kind = kind

    if (path?.length) {
      this.path = path
    }
  }
}

/**
 * Represents an array Diff.
 * @class
 * @extends Diff
 */
export class DiffArray extends Diff {
  /**
   * Creates an instance of DiffArray.
   * @param {Array} path - The path of the diff.
   * @param {number} index - The index in the array.
   * @param {Diff} item - The diff item.
   */
  constructor(path, index, item) {
    super('A', path)

    this.index = index
    this.item = item
  }
}

/**
 * Represents a deleted Diff.
 * @class
 * @extends Diff
 */
export class DiffDeleted extends Diff {
  /**
   * Creates an instance of DiffDeleted.
   * @param {Array} path - The path of the diff.
   * @param {*} value - The deleted value.
   */
  constructor(path, value) {
    super('D', path)

    this.lhs = value
  }
}

/**
 * Represents an edit Diff.
 * @class
 * @extends Diff
 */
export class DiffEdit extends Diff {
  /**
   * Creates an instance of DiffEdit.
   * @param {Array} path - The path of the diff.
   * @param {*} origin - The original value.
   * @param {*} value - The new value.
   */
  constructor(path, origin, value) {
    super('E', path)

    this.lhs = origin
    this.rhs = value
  }
}

/**
 * Represents a new Diff.
 * @class
 * @extends Diff
 */
export class DiffNew extends Diff {
  /**
   * Creates an instance of DiffNew.
   * @param {Array} path - The path of the diff.
   * @param {*} value - The new value.
   */
  constructor(path, value) {
    super('N', path)

    this.rhs = value
  }
}
