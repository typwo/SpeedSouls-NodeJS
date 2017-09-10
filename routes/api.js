var express = require('express');
var router = express.Router();
var url = require('url');
var speedruncom = require('../bin/speedruncom');
var apicache = require('apicache');

var cache = apicache.middleware;

/* GET home page. */
router.get('/leaderboards', cache('60 minutes'), function(req, res, next) {
    query = url.parse(req.url, true).query;
    var game = query.game === undefined ? false : query.game;
    var category = query.category === undefined ? false : query.category;
    speedruncom.getLeaderboards(game, category, function (data) {
        res.json(data);
    });

});

module.exports = router;
