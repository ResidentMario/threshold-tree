let d3 = require('d3');

class DataTree {
    
    constructor(data) {
    }
    
}

let data =  d3.request("./data/complaint_types.csv")
    .mimeType("text/csv")
    .response(function(xhr) { return d3.csvParse(xhr.responseText, row); });

debugger;