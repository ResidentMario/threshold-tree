'use strict';

// Cherry-pick only necessary parts of lodash, for the benefit of browserify.
const _reduce = require('lodash/reduce');
const _groupBy = require('lodash/groupBy');
const _zip = require('lodash/zip');
const _ = { 'reduce': _reduce, 'groupBy': _groupBy, 'zip': _zip };

class DataNode {
    constructor(name, n, parent, children) {
        this.name = name; this.n = n; this.parent = parent; this.children = children; this.other = null;
    }
}

class ThresholdTree {
    
    constructor(data, threshold) {

        if (!threshold) { this.threshold = 0.1; } else { this.threshold = threshold; }

        // Turn the data read-out into a tree.
        // Step 0: Generate a tree root.
        let n =_.reduce(data, function(sum, d) { return sum + Number(d['Count']); }, 0);
        let root = new DataNode('root', n, null, []);
        this.root = root;
        this.depth = 0;  // root node only.
        this.n = n;

        // Step 1: Establish first layer.
        let priors_hashmap = treeify_leading_variable(data, 'Type', root);
        this.depth = 1;  // first major column only.

        // Step 2 through n: Establish additional layers.
        let cols = Object.keys(data[0]);
        let ncols = Object.keys(data[0]).length - 1;
        for (let ncol = 1; ncol < ncols; ncol++) {
            let next_hashmap = treeify_nonleading_variable(data, cols[ncol], priors_hashmap);
            this.depth++;
        }

        // Step n + 1: shake the data into a logarithmic form.
        traverse_and_shake(this.root, this.threshold);

    }

    as_hierarchy() {
        let repr = [];
        traverse_and_flatten(this.root, repr);
        return repr;
    }
    // TODO: Add the d3.stratify() call necessary to get this working, and keep it from crashing (as it does currently).
    // cf. https://github.com/d3/d3-hierarchy/issues/33
    // cf. the traverse_and_flatten docstring.

}

function columnify_leading_variable(data, colname) {
    // Given input data in a JSON format returned by one of the d3 data ingestion methods, this method converts that
    // datas' leading variable into an array of the form [['Column Name', #], [.,.], ...].
    //
    // This method is a subroutine of treeify_leading_variable.
    //
    // This method is separate from `columnify_nonleading_variable`, which does almost the same thing but uses a slightly
    // different code path. In particular, this routine does not generate the `priors` variable, which in the
    // non-leading variable case points to the associated entry of the previous variable. Since this is the leading
    // variable, all of the nodes point to the root instead.
    //
    // Rather than merging the two methods together by generating a dummy `priors` in the leading_variables case and
    // having to do logic branching later on, I found it easier to just keep the two methods' logic separate.
    let groups = _.groupBy(data, colname);
    let counts = [];
    let keys = Object.keys(groups);
    for (let key of keys) {
        counts.push(_.reduce(groups[key], function(sum, d) { return sum + Number(d['Count']); }, 0))
    }
    return _.zip(keys, counts);
}

function treeify_leading_variable(data, colname, root) {
    // This routine attaches the leading variable entries and counts to the data model.
    //
    // It uses `columnify_leading_variable` as a subroutine.
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
    // Given input data in a JSON format returned by one of the d3 data ingestion methods, this method converts a
    // non-leading variable into an array of the form [['Column Name', #], [.,.], ...].
    //
    // This method is a subroutine of treeify_nonleading_variable.
    //
    // cf. the notes under `columnify_leading_variable`.
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
    // This routine attaches the nonleading variable entries and counts to the data model.
    //
    // It uses `columnify_leading_variable` as a subroutine.
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

function traverse_and_shake(node, threshold) {
    // Shakes the tree into shape by devolving too-small values into subchildren of an "Other" node.
    // The threshold for what's considered too small is set by `threshold`.

    node.children.map(function(subnode) {
        traverse_and_shake(subnode, threshold);
    });
    if (node.parent != null) {  // avoid touching the root
        let [this_n, parent_n] = [node.n, node.parent.n];
        if (threshold * parent_n > this_n) {
            // Shake.
            if (node.parent.other == null) {
                node.parent.other = new DataNode("Other", this_n, node.parent, node.children);
                node.parent.children.push(node.parent.other);
            } else {
                node.parent.other.children.push(node);
            }
            // Remove this node from the parent's children.
            node.parent.children = node.parent.children.filter(function(nd) { return nd.name != node.name; });
        }
    }
}

function traverse_and_flatten(node, repr) {
    // Traverses the tree and returns a representation of it which has been flattened into a simple list of the form:
    // [{"name": "Eve", "parent": "Cain"}, {...}, ...]
    // The D3 treemap algorithm (and other layout algorithms like it) expect you to provide it data in the form of the
    // root node of a hierarchy of nodes generated using D3's internal methods. This format is very similar to the one
    // used by the ThresholdTree that we have defined here, but is private, and is not exported when D3 is imported.
    // Hence we can't extend the D3 classes themselves in order to create that tree directly.
    //
    // So instead we flatten our own representation into an intermediate one which can be read by D3, the one above.
    // For further details see https://github.com/d3/d3-hierarchy/blob/master/README.md#stratify.
    //
    // This requires a surprising amount of sophistication. See http://stackoverflow.com/a/41813193/1993206.
    node.children.map(function(subnode) {
        traverse_and_flatten(subnode, repr);
    });
    if (node.parent != null) {
        repr.push({"name": node.name, "parent": node.parent.name, "n": node.n})
    }
}

// Export the tree struct.
exports.ThresholdTree = ThresholdTree;