# deep-diff-esm

**This is an ESM rewrite of the original [deep-diff](https://www.npmjs.com/package/deep-diff) library.**
The main functionality of the original library has been preserved for the most part with couple notable changes:

- The `DeepDiff` default export was removed for nodejs usage. See [Importing](#importing)
- Some of the optional arguments for `diff` and `observableDiff` functions are now passed as an options object. See [API Documentation](#api-documentation)

**deep-diff-esm** is a javascript/node.js module providing utility functions for determining the structural differences between objects and includes some utilities for applying differences across objects.

## Features

- Get the structural differences between two objects.
- Observe the structural differences between two objects.
- When structural differences represent change, apply change from one object to another.
- When structural differences represent change, selectively apply change from one object to another.

## Installation

```
npm install deep-diff-esm
```

Possible v1.0.0 incompatabilities:

- elements in arrays are now processed in reverse order, which fixes a few nagging bugs but may break some users
  - If your code relied on the order in which the differences were reported then your code will break. If you consider an object graph to be a big tree, then `deep-diff-esm` does a [pre-order traversal of the object graph](https://en.wikipedia.org/wiki/Tree_traversal), however, when it encounters an array, the array is processed from the end towards the front, with each element recursively processed in-order during further descent.

### Importing

#### nodejs

```javascript
// Import everything
import * as DeepDiff from 'deep-diff-esm'

// or import individually modules:
import { diff, observableDiff, applyDiff, applyChange, revertChange } from 'deep-diff-esm'
```

#### browser

```html
<script src="https://cdn.jsdelivr.net/npm/deep-diff-esm/dist/browser/deep-diff.min.js"></script>
```

In a browser, deep-diff-esm defines a global variable DeepDiff. If there is a conflict in the global namespace you can restore the conflicting definition and assign deep-diff-esm to another variable like this: var deep = DeepDiff.noConflict();

## Simple Examples

In order to describe differences, change revolves around an `origin` object. For consistency, the `origin` object is always the operand on the `left-hand-side` of operations. The `comparand`, which may contain changes, is always on the `right-hand-side` of operations.

```javascript
import { diff } from 'deep-diff-esm'

let lhs = {
  name: 'my object',
  description: "it's an object!",
  details: {
    it: 'has',
    an: 'array',
    with: ['a', 'few', 'elements']
  }
}

let rhs = {
  name: 'updated object',
  description: "it's an object!",
  details: {
    it: 'has',
    an: 'array',
    with: ['a', 'few', 'more', 'elements', { than: 'before' }]
  }
}

let differences = diff(lhs, rhs)
```

The code snippet above would result in the following structure describing the differences:

```javascript
;[
  { kind: 'E', path: ['name'], lhs: 'my object', rhs: 'updated object' },
  { kind: 'E', path: ['details', 'with', 2], lhs: 'elements', rhs: 'more' },
  { kind: 'A', path: ['details', 'with'], index: 3, item: { kind: 'N', rhs: 'elements' } },
  { kind: 'A', path: ['details', 'with'], index: 4, item: { kind: 'N', rhs: { than: 'before' } } }
]
```

### Differences

Differences are reported as one or more change records. Change records have the following structure:

- `kind` - indicates the kind of change; will be one of the following:
  - `N` - indicates a newly added property/element
  - `D` - indicates a property/element was deleted
  - `E` - indicates a property/element was edited
  - `A` - indicates a change occurred within an array
- `path` - the property path (from the left-hand-side root)
- `lhs` - the value on the left-hand-side of the comparison (undefined if kind === 'N')
- `rhs` - the value on the right-hand-side of the comparison (undefined if kind === 'D')
- `index` - when kind === 'A', indicates the array index where the change occurred
- `item` - when kind === 'A', contains a nested change record indicating the change that occurred at the array index

Change records are generated for all structural differences between `origin` and `comparand`. The methods only consider an object's own properties and array elements; those inherited from an object's prototype chain are not considered.

Changes to arrays are recorded simplistically. We care most about the shape of the structure; therefore we don't take the time to determine if an object moved from one slot in the array to another. Instead, we only record the structural
differences. If the structural differences are applied from the `comparand` to the `origin` then the two objects will compare as "deep equal" using most `isEqual` implementations such as found in [lodash](https://github.com/bestiejs/lodash) or [underscore](http://underscorejs.org/).

### Changes

When two objects differ, you can observe the differences as they are calculated and selectively apply those changes to the origin object (left-hand-side).

```javascript
import { applyChange, observableDiff } from 'deep-diff-esm'

let lhs = {
  name: 'my object',
  description: "it's an object!",
  details: {
    it: 'has',
    an: 'array',
    with: ['a', 'few', 'elements']
  }
}

let rhs = {
  name: 'updated object',
  description: "it's an object!",
  details: {
    it: 'has',
    an: 'array',
    with: ['a', 'few', 'more', 'elements', { than: 'before' }]
  }
}

observableDiff(lhs, rhs, (d) => {
  // Apply all changes except to the name property...
  if (d.path[d.path.length - 1] !== 'name') {
    applyChange(lhs, rhs, d)
  }
})
```

## API Documentation

- `diff(lhs, rhs, [options: { prefilter, accummulator, orderIndependent }])` &mdash; calculates the differences between two objects, using the specified `prefilter`, `accumulator`, and `orderIndependent` options.
- `observableDiff(lhs, rhs, observer, [options: { prefilter, orderIndependent }])` &mdash; calculates the differences between two objects and reports each to an observer function, using the specified `prefilter` and `orderIndependent` options.
- `applyDiff(target, source, filter)` &mdash; applies any structural differences from a source object to a target object, optionally filtering each difference.
- `applyChange(target, source, change)` &mdash; applies a single change record to a target object. NOTE: `source` is unused and may be removed.
- `revertChange(target, source, change)` &mdash; reverts a single change record to a target object. NOTE: `source` is unused and may be removed.

### `diff`

The `diff` function calculates the difference between two objects.

#### Arguments

- `lhs` - the left-hand operand; the origin object.
- `rhs` - the right-hand operand; the object being compared structurally with the origin object.
- `options` - A configuration object that can have the following properties:
  - `prefilter`: A function that determines whether difference analysis should continue down the object graph. This function can also replace the `options` object in the parameters for backward compatibility. If it is an object, it has the following properties:
    - `prefilter`: Same `prefilter` function as above.
    - `normalize`: A function that pre-processes every _leaf_ of the tree.
  - `accumulator`: An optional accumulator/array (requirement is that it have a `push` function). Each difference is pushed to the specified accumulator.
  - `orderIndependent`: Whether to perform order-independent comparison. Default is false.

Returns either an array of changes or, if there are no changes, `undefined`. This was originally chosen so the result would pass a truthy test:

```javascript
let changes = diff(obja, objb)
if (changes) {
  // do something with the changes.
}
```

#### Pre-filtering Object Properties

The `prefilter`'s signature should be `function(path, key)` and it should return a truthy value for any `path`-`key` combination that should be filtered. If filtered, the difference analysis does no further analysis of on the identified object-property path.

```javascript
import { diff } from 'deep-diff-esm'
import { assert } from 'chai'

const data = {
  issue: 126,
  submittedBy: 'abuzarhamza',
  title: 'readme.md need some additional example prefilter',
  posts: [
    {
      date: '2018-04-16',
      text: `additional example for prefilter for deep-diff would be great.
      https://stackoverflow.com/questions/38364639/pre-filter-condition-deep-diff-node-js`
    }
  ]
}

const clone = JSON.parse(JSON.stringify(data))
clone.title = 'README.MD needs additional example illustrating how to prefilter'
clone.disposition = 'completed'

const two = diff(data, clone)
const none = diff(data, clone, (path, key) => path.length === 0 && ['title', 'disposition'].inclued(key))

assert.equal(two.length, 2, 'should reflect two differences')
assert.ok(typeof none === 'undefined', 'should reflect no differences')
```

#### Normalizing object properties

The `normalize`'s signature should be `function(path, key, lhs, rhs)` and it should return either a falsy value if no normalization has occured, or a `[lhs, rhs]` array to replace the original values. This step doesn't occur if the path was filtered out in the `prefilter` phase.

```javascript
import { diff } from 'deep-diff-esm'
import { assert } from 'chai'

const data = {
  pull: 149,
  submittedBy: 'saveman71'
}

const clone = JSON.parse(JSON.stringify(data))
clone.issue = 42

const two = diff(data, clone)
const none = diff(data, clone, {
  normalize: (path, key, lhs, rhs) => {
    if (lhs === 149) {
      lhs = 42
    }
    if (rhs === 149) {
      rhs = 42
    }
    return [lsh, rhs]
  }
})

assert.equal(two.length, 1, 'should reflect one difference')
assert.ok(typeof none === 'undefined', 'should reflect no difference')
```

### `observableDiff`

The `observableDiff` function calculates the difference between two objects and reports each to an observer function.

#### Argmuments

- `lhs` - The left-hand operand; the origin object.
- `rhs` - The right-hand operand; the object being compared structurally with the origin object.
- `observer` - The observer to report to.
- `options` - A configuration object that can have the following properties:
  - `prefilter`: A function that determines whether difference analysis should continue down the object graph. This function can also replace the `options` object in the parameters for backward compatibility. If it is an object, it has the following properties:
    - `prefilter`: Same `prefilter` function as above.
    - `normalize`: A function that pre-processes every _leaf_ of the tree.
  - `orderIndependent`: Whether to perform order-independent comparison. Default is false.

## Contributing

When contributing, keep in mind that it is an objective of `deep-diff-esm` to have no package dependencies. This may change in the future, but for now, no-dependencies.

Please run the unit tests before submitting your PR: `npm test`. Hopefully your PR includes additional unit tests to illustrate your change/modification!

When you run `npm test`, linting will be performed and any linting errors will fail the tests... this includes code formatting.
