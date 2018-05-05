var express = require('express');
var bodyParser = require('body-parser');
var User = require('../models/user');
var logger = require("../logger");

var userRouter = express.Router();

userRouter.use(bodyParser.json());

userRouter.route('/signup')
    .post(function(req, res, next) {
        console.log(req.body);
        req.body.username = req.body.email.split('@')[0];
        User.count({username: {$regex: req.body.username}}, function (err, count) {
            if (err) {
                logger.error(err);
                return res.status(500).send(err);
            }
            var toAppend = count==0?'':count;
            req.body.username = req.body.email.split('@')[0] + toAppend;
            var user = {};
            user.uid = req.body.uid;
            user.name = req.body.displayName;
            user.email = req.body.email;
            user.username = req.body.username;
            User.create(user, function (err, user) {
                if (err) {
                    logger.error(err);
                    return res.status(500).send(err);
                }
                logger.debug("SignUp Successful");
                res.status(200).send({
                    message: 'SignUp Successful',
                    userInfo: user
                });
            });
        });
    });


userRouter.route('/login')
    .post(function(req, res, next) {
        User.findOne({uid: req.body.uid}, function (err, user) {
            if (err) {
                return res.status(500).send(err);
            }
            return res.status(200).send({
                userInfo: user
            });
        });
    });

userRouter.route('/revalidate')

    .post(function(req, res, next) {
        User.findOne({uid: req.body.uid}, function (err, user) {
            if (err) {
                return res.status(500).send(err);
            }
            return res.status(200).send({
                userInfo: user
            });
        });
    });




module.exports = userRouter;