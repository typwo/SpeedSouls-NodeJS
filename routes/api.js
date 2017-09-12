var express = require('express');
var router = express.Router();
var url = require('url');
var speedruncom = require('../bin/speedruncom');
var apicache = require('apicache');
var util = require("util");
var http = require("http");

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

/**
 * RETURNS THE SCRIPT TAG THAT HAS THE CATEGORIES FROM A SPEEDRUN.COM GAME PAGE
 */
router.get('/speedruncom-cats/:game', cache('60 minutes'),function (req, res_, next) {
    const $ = require('cheerio');

    var options = {
        host: 'www.speedrun.com',
        port: 80,
        path: '/' + req.params.game
    };

    var content = "";

    req = http.request(options, function(res) {
        res.setEncoding("utf8");
        res.on("data", function (chunk) {
            content += chunk;
        });

        res.on("end", function () {
            var html = $.load(content);
            var div = html('div.maincontent > script');
            res_.json({data: div.html()});
        });
    });
    req.end();
});

/**
 * RETURNS THE LEADERBOARDS PAGE FROM A SPEEDRUN.COM
 */
router.get('/speedruncom-leaderboards/:game/:category', cache('60 minutes'), function (req, res_, next) {
    const $ = require('cheerio');

    var options = {
        host: 'www.speedrun.com',
        port: 80,
        path: '/ajax_leaderboard.php?game=' + req.params.game + '&category=' + req.params.category
    };

    var content = "";

    req = http.request(options, function(res) {
        res.setEncoding("utf8");
        res.on("data", function (chunk) {
            content += chunk;
        });

        res.on("end", function () {
            var html = $.load(content);
            var div = html('html > body > table');
            res_.json({data: div.html()});
        });
    });
    req.end();
});

/**
 * RETURNS CATEGORY
 */
router.get('/games/:game/category/:category', function (req, res_, next) {
    speedruncom.findCategory(req.params.game, req.params.category, function (data) {
        res_.json(data);
    })
});


module.exports = router;
