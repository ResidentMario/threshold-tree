# threshold-tree

This is a small module which exports a `ThresholdTree` object. A threshold tree as it is refered to here is a type of [tree data structure](https://en.wikipedia.org/wiki/Tree_(data_structure)) which collects children of a parent node which constitute less than some `threshold%` of the total `n` of that node into an `Other` child node and constituent subtree.

Since this bit of code was written for `d3-log-treemap` (forthcoming), a `d3` visual data display project, `ThresholdTree` is an object construct which accepts two parameters: `data`, a data object as outputted by e.g. `d3.csvParse(csvString)`, and `threshold`, the ratio of the parent node's total entries each child node must have to preserve independence.

## Installation

To get this for [Node.JS](https://nodejs.org/en/):

`npm install threshold-tree`

To build a bundle for front-end using [browserify](http://browserify.org/) run:

`browserify threshold-tree.js -o bundle.js`

Maybe I'll put it on [unpkg](https://unpkg.com/) at some point...
