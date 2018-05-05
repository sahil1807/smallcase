var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Trade = require('./trade');

var Portfolio = new Schema(
    {
        name: String,
        value: {
            type: Number,
            default: 0
        },
        cash: {
            type: Number,
            default: 0
        },
        cumulativeReturn: {
            type: Number,
            default: 0
        },
        created: {
            type: Date,
            default: Date.now
        },
        modified: Date,
        createdBy: {
            uid: String,
            name: String
        },
        holdings: [{
            ticker: String,
            quantity: Number,
            averageCost: Number,
            marketPrice: Number,
            currentValue: Number,
            profitLoss: Number,
            netChange: String,
            dayChange: Number,
            lastPrice: Number
        }],
        trades: [Trade]
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Portfolio', Portfolio);
