var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = new Schema(
    {
        uid: String,
        email: String,
        phone:Number,
        username: {
            type: String,
            unique: true
        },
        //Portfolio ID stored in user collection
        portfolioId: String,
        firstName: String,
        lastName: String,
        addressLine1: String,
        addressLine2: String,
        city: String,
        state: String,
        zipCode: String,
        country: String

    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('User', User);