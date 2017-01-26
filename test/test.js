'use strict';

// Load data.
const tree = require('../threshold-tree');
const d3 = require('d3');
const assert = require('assert');

// Load in the data file as it would be loaded in the browser.
const fs = require('fs');
const csvString = fs.readFileSync('data/complaint_types.csv').toString();
const raw_data = d3.csvParse(csvString);

let data = new tree.ThresholdTree(raw_data);

debugger;

// Note: though this module is intended to be general-purpose, it has not been extensively tested for use outside of the
// dataset for whose display I originally wrote this module in the first place. In other words, this module is, for the
// moment, single-use. Hence these tests just test that it loads that particular dataset correctly, not any dataset in
// general.
describe('ThresholdTree', function() {
    describe("top-level properties", function() {
        it("initializes this.n", function() {
            assert.equal(data.n, 2374716);
        });
        it("initializes this.depth", function() {
            assert.equal(data.depth, 2);
        });
        it("initializes this.root", function() {
            assert.equal(data.root.parent, null);
            assert.equal(data.root.children.length, 7);
        });
    });
    describe("nodal properties", function() {
        it("ensures that nodes are seperated by order of magnitude", function() {
            let n = data.n;
            data.root.children.forEach(function(node) {
                if (node.name != "Other") {  // The collector Other node may be under-subscribed.
                    assert.ok(String(n).length == String(node.n * 10).length);
                } else { return true; }
            });
        });
    });
});