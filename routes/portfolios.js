var express = require('express');
var bodyParser = require('body-parser');
var logger = require("../logger");
var User = require('../models/user');
var Portfolio = require('../models/portfolio');

var portfolioRouter = express.Router();

portfolioRouter.use(bodyParser.json());


portfolioRouter.route('/createPortfolio')

    .post(function(req, res, next) {
        Portfolio.create(req.body, function(err, portfolio) {
            if (err){
                logger.error(err);
                return res.status(500).send(err);
            }
            logger.debug("Portfolio created Successfully - : \n" +portfolio);
            User.findOne({uid: req.body.createdBy.uid}, function(err, user) {
                if (err) {
                    return res.status(500).send(err);
                }
                console.log(user);
                user.portfolioId = portfolio._id;
                user.save(function (err, updatedUser) {
                    if (err) {
                        return res.status(500).send(err);
                    }
                    return res.status(200).send({
                        userInfo: updatedUser,
                        portfolio: portfolio
                    });
                })
            })
        });
    });

/*
TASK 1: Get Portfolio
 */

portfolioRouter.route('/:portfolioId')

    .get(function(req, res, next) {
        Portfolio.findOne({_id: req.params.portfolioId}, function(err, result) {
            if (err){
                logger.error(err);
                return res.status(500).send(err);
            }
            return res.status(200).send(result);
        })
    });

portfolioRouter.route('/holdings/:portfolioId')

    .get(function (req, res, next) {
        Portfolio.findOne({_id: req.params.portfolioId},function (err, result) {
            if (err){
                logger.error(err);
                return res.status(500).send(err);
            }
            return res.status(200).send(result.holdings);
        })
    });


portfolioRouter.route('/returns/:portfolioId')

    .get(function (req, res, next) {
        Portfolio.findOne({_id: req.params.portfolioId} ,function (err, portfolio) {
            if (err){
                logger.error(err);
                return res.status(500).send(err);
            }
            var totalCost=0;
            var totalValue=0;
            portfolio.holdings.forEach(function (toMatch, index) {
                totalCost+= (toMatch.quantity*toMatch.averageCost);
                totalValue += (toMatch.quantity*(10 - toMatch.averageCost));

                if(index === (portfolio.holdings.length -1)){
                    return res.status(200).send({holdings:portfolio.holdings , totalValue:totalValue , totalCost:totalCost , cash: portfolio.cash});
                }
            });
        })
    });



module.exports = portfolioRouter;