var express = require('express');
var bodyParser = require('body-parser');
var logger = require("../logger");
var mongoose = require('mongoose');
var Portfolio = require('../models/portfolio');
var Trade = mongoose.model('Trade', require('../models/trade'));

var tradeRouter = express.Router();

tradeRouter.use(bodyParser.json());


/*
TASK 1: Add Trade
 */

tradeRouter.route('/addTrade')

    .post(function (req, res, next) {
        Portfolio.findOne({_id: req.body.portfolioId}, {
            value: true,
            cash: true,
            cumulativeReturn: true,
            modified: true,
            holdings: {$elemMatch: {ticker: req.body.ticker}}
        }, function (err, portfolio) {
            //Portfolio.update({_id: req.body.portfolioId}, {$pull: {holdings: {ticker: req.body.ticker}}}, function (err, portfolio){
            if (err) {
                return res.status(500).send(err);
            }
            if (!portfolio) {
                return res.status(500).send("No portfolio found");
            }
            if (req.body.type === "buy" && (req.body.value > portfolio.cash)) {
                return res.status(500).send("Invalid Trade: Not enough balance");
            }

            if (req.body.type === "sell" && (portfolio.holdings.length === 0)) {
                return res.status(500).send("Invalid Trade: Not enough shares");
            }

            Trade.create(req.body, function (err, trade) {
                if (err) {
                    logger.error(err);
                    return res.status(500).send(err);
                }
                console.log(trade);
                if (portfolio.holdings.length === 0) {
                    console.log("Test1")
                    var data = {
                        ticker: req.body.ticker,
                        quantity: req.body.quantity,
                        averageCost: req.body.price,
                        marketPrice: 100,
                        currentValue: 100 * req.body.value,
                        profitLoss: 0,
                        netChange: 0,
                        dayChange: 0,
                        lastPrice: 0
                    }
                }
                else {
                    var data = {
                        ticker: req.body.ticker,
                        quantity: portfolio.holdings[0].quantity,
                        averageCost: portfolio.holdings[0].averageCost,
                        marketPrice: 100,
                        profitLoss: portfolio.holdings[0].profitLoss,
                        netChange: portfolio.holdings[0].netChange,
                        dayChange: portfolio.holdings[0].dayChange,
                        lastPrice: portfolio.holdings[0].lastPrice
                    };

                    if (req.body.type === "buy") {
                        data.averageCost = (data.averageCost * data.quantity + req.body.value) / (data.quantity + req.body.quantity);
                        data.quantity += req.body.quantity;
                        data.currentValue = data.averageCost * data.quantity;
                    }
                    else {
                        data.quantity = data.quantity - req.body.quantity;
                        data.currentValue = data.averageCost * data.quantity;
                    }

                }
                Portfolio.update({_id: req.body.portfolioId}, {$pull: {holdings: {ticker: req.body.ticker}}}, function (err, modified) {


                    if (err) {
                        logger.error(err);
                        return res.status(500).send(err);
                    }
                    Portfolio.findOne({_id: req.body.portfolioId}, function (err, mportfolio) {
                        if (err) {
                            logger.error(err);
                            return res.status(500).send(err);
                        }
                        if (!mportfolio) {
                            return res.status(500).send({
                                message: 'No portfolio found'
                            });
                        }

                        if (mportfolio.holdings) {
                            mportfolio.holdings.push(data);
                        } else {
                            mportfolio.holdings = [];
                            mportfolio.holdings.push(data);
                        }
                        if (mportfolio.trades) {
                            mportfolio.trades.push(trade);
                        } else {
                            mportfolio.trades = [];
                            mportfolio.trades.push(trade);
                        }

                        if (trade.type === "buy")
                            mportfolio.cash = mportfolio.cash - trade.value;
                        else
                            mportfolio.cash = mportfolio.cash + trade.value;

                        mportfolio.save(function (err, updatedUser) {
                            if (err) {
                                logger.error(err);
                                return res.status(500).send(err);
                            }
                            return res.status(200).send({
                                userInfo: updatedUser
                            });
                        })
                    })
                })
            })
        });

    });


/*
TASK 1: Add Trade
 */

tradeRouter.route('/deleteTrade')

    .post(function (req, res, next) {
        Portfolio.findOne({_id: req.body.portfolioId}, {
            value: true,
            cash: true,
            cumulativeReturn: true,
            modified: true,
            trades: {$elemMatch: {_id: req.body._id}},
            holdings: {$elemMatch: {ticker: req.body.ticker}}
        }, function (err, portfolio) {

            if (err) {
                return res.status(500).send(err);
            }
            if (!portfolio) {
                return res.status(500).send("No portfolio found");
            }

            if (portfolio.trades.length === 0)
                return res.status(500).send("No trade found");

            var data = {
                ticker: req.body.ticker,
                quantity: portfolio.holdings[0].quantity,
                averageCost: portfolio.holdings[0].averageCost,
                marketPrice: 100,
                profitLoss: portfolio.holdings[0].profitLoss,
                netChange: portfolio.holdings[0].netChange,
                dayChange: portfolio.holdings[0].dayChange,
                lastPrice: portfolio.holdings[0].lastPrice
            };

            if (portfolio.trades[0].type === "buy") {
                data.averageCost = (data.averageCost * data.quantity - portfolio.trades[0].value) / (data.quantity - portfolio.trades[0].quantity);
                data.quantity = data.quantity - portfolio.trades[0].quantity;
                data.currentValue = data.averageCost * data.quantity;
            }
            else {
                data.quantity = data.quantity + portfolio.trades[0].quantity;
                data.currentValue = data.averageCost * data.quantity;
            }


            Portfolio.findByIdAndUpdate(req.body.portfolioId, {
                $pull: {
                    trades: {_id: req.body._id},
                    holdings: {ticker: req.body.ticker}
                }
            }, {
                safe: true,
                upsert: true
            }, function (err, mportfolio) {

                console.log(mportfolio);

                if (err) {
                    logger.error(err);
                    return res.status(500).send(err);
                }
                if (!mportfolio) {
                    return res.status(500).send({
                        message: 'No portfolio found'
                    });
                }

                if (mportfolio.holdings) {
                    mportfolio.holdings.push(data);
                } else {
                    mportfolio.holdings = [];
                    mportfolio.holdings.push(data);
                }

                if (portfolio.trades[0].type === "buy")
                    mportfolio.cash = mportfolio.cash + portfolio.trades[0].value;
                else
                    mportfolio.cash = mportfolio.cash - portfolio.trades[0].value;


                mportfolio.save(function (err, updatedPortfolio) {
                    if (err) {
                        logger.error(err);
                        return res.status(500).send(err);
                    }
                    Portfolio.findOne({_id: req.body.portfolioId}, function (err, mportfolio) {
                        if (err) {
                            logger.error(err);
                            return res.status(500).send(err);
                        }

                        return res.status(200).send({
                            portfolio: mportfolio
                        });
                    })

                })
            })
        })
    })


/*
TASK 3: Modify Trade
 */

tradeRouter.route('/modifyTrade')

    .post(function (req, res, next) {


        Portfolio.findOne({_id: req.body.portfolioId}, {
            value: true,
            cash: true,
            cumulativeReturn: true,
            modified: true,
            trades: {$elemMatch: {_id: req.body._id}},
            holdings: {$elemMatch: {ticker: req.body.ticker}}
        }, function (err, portfolio) {

            if (err) {
                return res.status(500).send(err);
            }
            if (!portfolio) {
                return res.status(500).send("No portfolio found");
            }

            if (portfolio.trades.length === 0)
                return res.status(500).send("No trade found");

            var data = {
                ticker: req.body.ticker,
                quantity: portfolio.holdings[0].quantity,
                averageCost: portfolio.holdings[0].averageCost,
                marketPrice: 100,
                profitLoss: portfolio.holdings[0].profitLoss,
                netChange: portfolio.holdings[0].netChange,
                dayChange: portfolio.holdings[0].dayChange,
                lastPrice: portfolio.holdings[0].lastPrice
            };

            console.log(portfolio.trades);
            if (req.body.type === "buy" && portfolio.trades[0].type ==="sell") {
                data.averageCost = (data.averageCost * data.quantity + portfolio.trades[0].value + req.body.value) / (data.quantity + portfolio.trades[0].quantity + req.body.quantity);
                data.quantity = data.quantity + portfolio.trades[0].quantity + req.body.quantity;
                data.currentValue = data.averageCost * data.quantity;
            }
            else if (req.body.type === "sell" && portfolio.trades[0].type ==="sell") {
                data.averageCost = (data.averageCost * data.quantity - portfolio.trades[0].value + req.body.value) / (data.quantity - portfolio.trades[0].quantity + req.body.quantity);
                data.quantity = data.quantity - portfolio.trades[0].quantity + req.body.quantity;
                data.currentValue = data.averageCost * data.quantity;
            }


            else if (req.body.type === "sell" && portfolio.trades[0].type ==="buy") {
                    data.averageCost = (data.averageCost * data.quantity + portfolio.trades[0].value - req.body.value) / (data.quantity + portfolio.trades[0].quantity - req.body.quantity);
                    data.quantity = data.quantity + portfolio.trades[0].quantity - req.body.quantity;
                    data.currentValue = data.averageCost * data.quantity;
                }
             else{
                data.averageCost = (data.averageCost * data.quantity - portfolio.trades[0].value - req.body.value) / (data.quantity - portfolio.trades[0].quantity - req.body.quantity);
                data.quantity = data.quantity - portfolio.trades[0].quantity - req.body.quantity;
                data.currentValue = data.averageCost * data.quantity;
            }


            Portfolio.findByIdAndUpdate(req.body.portfolioId, {
                $pull: {
                    trades: {_id: req.body._id},
                    holdings: {ticker: req.body.ticker}
                }
            }, {
                safe: true,
                upsert: true
            }, function (err, mportfolio) {

                console.log(mportfolio);

                if (err) {
                    logger.error(err);
                    return res.status(500).send(err);
                }
                if (!mportfolio) {
                    return res.status(500).send({
                        message: 'No portfolio found'
                    });
                }

                if (mportfolio.holdings) {
                    mportfolio.holdings.push(data);
                } else {
                    mportfolio.holdings = [];
                    mportfolio.holdings.push(data);
                }

                if (portfolio.trades[0].type === "buy" && portfolio.trades[0].type ==="sell")
                    mportfolio.cash = mportfolio.cash + portfolio.trades[0].value + req.body.value;
                else if (portfolio.trades[0].type === "buy" && portfolio.trades[0].type ==="buy")
                    mportfolio.cash = mportfolio.cash + portfolio.trades[0].value- req.body.value;
                else if (portfolio.trades[0].type === "sell" && portfolio.trades[0].type ==="sell")
                    mportfolio.cash = mportfolio.cash - portfolio.trades[0].value+ req.body.value;
                else
                    mportfolio.cash = mportfolio.cash - portfolio.trades[0].value- req.body.value;

                mportfolio.trades.push(req.body);

                mportfolio.save(function (err, updatedPortfolio) {
                    if (err) {
                        logger.error(err);
                        return res.status(500).send(err);
                    }
                    Portfolio.findOne({_id: req.body.portfolioId}, function (err, mportfolio) {
                        if (err) {
                            logger.error(err);
                            return res.status(500).send(err);
                        }

                        return res.status(200).send({
                            portfolio: mportfolio
                        });
                    })

                })
            })
        })


    });


        module.exports = tradeRouter;