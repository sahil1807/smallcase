var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Trade = new Schema(
    {
        // Buy or Sell
        type: String,
        // Number of shares bought
        quantity: Number,
        // Price per share
        price: Number,
        //Portfolio trade belongs to
        portfolioId: String,
        // Total value of trade
        value: Number,
        // Stock company ticker
        ticker: String,
        // Time of transaction
        time: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = Trade;