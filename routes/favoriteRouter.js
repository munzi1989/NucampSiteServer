const express = require('express');
const authenticate = require('../authenticate');
const cors = require('./cors');
const Favorite = require('../models/favorite');
const bodyParser = require('body-parser');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());


favoriteRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        if (!req.user.admin) {
            Favorite.findOne({ user: req.user._id })
                .populate('user')
                .populate('campsites')
                .then(favorite => {
                    if (!favorite) {
                        res.end('You have no favorites.')
                    } else {
                        console.log(favorite);
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json')
                        res.json(favorite);
                    }
                }, (err) => next(err))
                .catch(err => next(err));
        } else {
            Favorite.find()
                .populate('user')
                .populate('favorites.campsites')
                .then(favorite => {
                    if (!favorite) {
                        res.end('There are no favorites.')
                    } else {
                        console.log(favorite);
                        res.json(favorite);
                    }
                }, (err) => next(err))
                .catch(err => next(err));
        }
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({ user: req.user._id })
            .then(favorite => {
                console.log('!!!!!!!!! WE HAVE A FAVORITE')
                if (favorite) {
                    console.log('RUNS UP TO THIS POINT', favorite);
                    for (i = 0;i < req.body.length;i++) {
                        if (favorite.campsites.includes(req.body[i]._id)) {
                            console.log(`ALREADY A FAVORITE: `, req.body[i]);
                        } else {
                            favorite.campsites.push(req.body[i]._id);
                            console.log(`ADDED CAMPSITE: `, req.body[i]);
                            favorite.save()
                        }
                    }
                    console.log(`CURRENT FAVORITES : `, favorite);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                } else {
                    Favorite.create({ user: req.user._id, campsites: req.body })
                        .then(favorite => {
                            console.log(`Created Favorite: `, favorite);
                            res.statusCode = 200;
                            res.setHeader('Content-Type', "application/json")
                            res.json(favorite);

                        }, (err) => next(err));
                }
            }).catch(err => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /favorites');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOneAndRemove({ user: req.user._id })
            .then(response => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(response);
            }, (err) => next(err))
            .catch(err => next(err));
    });

favoriteRouter.route('/:campsiteId')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('GET operation not supported on favorites/:campsiteId');
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({ user: req.user._id })
            .then(favorite => {
                console.log('WE HAVE A FAVORITE', favorite);
                if (favorite) {
                    if (favorite.campsites.includes(req.params.campsiteId)) {
                        console.log(`THIS CAMPSITE: ${req.params.campsiteId} IS ALREADY FAVORITED`);
                        res.json(favorite);
                    } else {
                        favorite.campsites.push(req.params.campsiteId);
                        console.log('ADDED FAVORITE: ', req.params.campsiteId)
                        favorite.save()
                            .then(favorite => {
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.json(favorite)
                            });
                    }
                } else {
                    Favorite.create({ user: req.user._id, campsites: req.params.campsiteId })
                        .then(favorite => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorite)
                            favorite.save()
                        }, err => next(err))
                }
            }, err => next(err))
            .catch(err => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /favorites/:campsiteId');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({ user: req.user._id })
        .then(favorites => {
            if (favorites) {
                let index = favorites.campsites.indexOf(req.params.campsiteId);
                if (index >= 0) {
                    console.log(`DELETING FAVORITE: ${req.params.campsiteId}`)
                    favorites.campsites.splice(index, 1);
                    favorites.save();
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json')
                    res.json(favorites);
                } else {
                    res.statusCode = 404;
                    res.end('THIS CAMPSITE IS NOT A FAVORITE')
                }
            } else {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(`THERE ARE NO FAVORITES FOR: ${req.user._id} `);
            }
        }).catch(err => next(err))
    });


module.exports = favoriteRouter;

