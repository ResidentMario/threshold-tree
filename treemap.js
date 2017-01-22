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
        let priors_hashmap = treeify_leading_variable(data, 'Type', root);
        this.depth = 1;  // first major column only.

        // Step 2: Establish second layer.
        let next_hashmap = treeify_nonleading_variable(data, 'Subtype', priors_hashmap);
        this.depth = 1;


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
    let priors_hashmap = {};
    type_nodes.forEach(function(datum) {
        let [name, n] = datum;
        let new_node = new DataNode(name, n, root, []);
        root.children.push(new_node);  // add the node to the tree
        priors_hashmap[name] = new_node;  // hash node for lookup later.
    });
    return priors_hashmap;
}

function columnify_nonleading_variable(data, colname) {
    let colnames = Object.keys(data[0]);
    let prior_colname = colnames[colnames.indexOf('Subtype') - 1];
    let groups = _.groupBy(data, colname);
    let keys = Object.keys(groups);

    let counts = [];
    let priors = [];
    for (let key of keys) {
        // an intermediate column may be repeated multiple times, so the group is always a list.
        // But they ought to have the same predecessor value, so we just use the first one.
        priors.push(groups[key][0][prior_colname]);
        counts.push(_.reduce(groups[key], function(sum, d) { return sum + Number(d['Count']); }, 0));
    }

    return _.zip(keys, counts, priors);
}

function treeify_nonleading_variable(data, colname, priors_hashmap) {
    let type_nodes = columnify_nonleading_variable(data, colname);
    let new_priors_hashmap = {};
    type_nodes.forEach(function(datum) {
        let [name, n, prior] = datum;
        let new_node = new DataNode(name, n, priors_hashmap[prior], []);
        priors_hashmap[prior].children.push(new_node);  // add the node to the tree
        new_priors_hashmap[name] = new_node;  // hash node for lookup later.
    });
    return new_priors_hashmap;
}

debugger;
let tree = new DataTree(data);

// TODO: Correct the one thing incorrectly exported as just "Property" in the 311 dataset.