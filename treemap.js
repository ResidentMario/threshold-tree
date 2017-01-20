'use strict';

// Load in the data file as it would be loaded in the browser.
const fs = require('fs');
const csvString = fs.readFileSync('data/complaint_types.csv').toString();
const d3 = require('d3');
const data = d3.csvParse(csvString);

// Additional imports needed.
const _ = require('lodash');

// let D3Node = require('d3-node');
// let d3 = D3Node.d3;
//let d3n = new D3Node();

class DataNode {
    constructor(name, n, parent, children) {
        this.name = name; this.n = n; this.parent = parent; this.children = children;
    }
}

class DataTree {
    
    constructor(data) {

        // Turn the data read-out into a tree.
        // Step 0: Generate a tree root.
        let root = new DataNode('root', NaN, null, []); // TODO: compute n for everything altogether.
        this.root = root;
        this.depth = 0;  // root node only.

        // Step 1: Establish first layer.
        treeify_leading_variable(data, 'Type', root);
        this.depth = 1;  // first major column only.

        // Step 2: Establish second layer.

        // Step 3: 


        // TODO: Extend this methodology to n layers.
    }
    
}

// console.log(data);

// let data =  d3.request("./data/complaint_types.csv")
//     .mimeType("text/csv")
//     .response(function(xhr) { return d3.csvParse(xhr.responseText, row); });

function columnify_leading_variable(data, colname) {
    // Given input data in a JSON format returned by one of the d3 data ingestion methods, this method converts that
    // datas' leading variable into an array of the form [['Column Name', #], [.,.], ...].
    // Subroutine of treeify_leading_variable.
    let groups = _.groupBy(data, colname);
    let counts = [];
    let keys = Object.keys(groups);
    for (let key of keys) {
        counts.push(_.reduce(groups[key], function(sum, d) { return sum + Number(d['Count']); }, 0))
    }
    return _.zip(keys, counts);
}

function treeify_leading_variable(data, colname, root) {
    // Given input data in a JSON format returned by one of the d3 data ingestion methods, this method converts that
    // datas' leading variable into an array of the form [['Column Name', #], [.,.], ...].
    let type_nodes = columnify_leading_variable(data, colname);
    type_nodes.forEach(function(datum) { root.children.push(new DataNode(datum[0], datum[1], root, [])); });
}

// console.log(columnify_leading_variable(data, 'Type'));
debugger;
let tree = new DataTree(data);

// TODO: Correct the one thing incorrectly exported as just "Property" in the 311 dataset.