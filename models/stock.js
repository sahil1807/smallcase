var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Stock = new Schema(
    {
        // Stock name
        name: String,
        //Stock ticker
        ticker: String,
        //Exchange like NSE/BSE
        exchange: String
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Stock', Stock);