var express = require('express');
var router = express.Router();
var url = require('url');
var speedruncom = require('../bin/speedruncom');
var apicache = require('apicache');
var http = require("http");

var cache = apicache.middleware;
var cache_value = '10 minutes';

/* GET home page. */
router.get('/leaderboards', cache(cache_value), function(req, res, next) {
    query = url.parse(req.url, true).query;
    var game = query.game === undefined ? false : query.game;
    var category = query.category === undefined ? false : query.category;
    var vars = query.vars === undefined ? false : query.vars;
    speedruncom.getLeaderboards(game, category, vars, function (data) {
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
router.get('/speedruncom-leaderboards/:game/:category', cache(cache_value), function (req, res_, next) {
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
router.get('/games/:game/category/:category', cache(cache_value), function (req, res_, next) {
    speedruncom.findCategory(req.params.game, req.params.category, function (data) {
        res_.json(data);
    })
});

/**
 * RETURNS WORLD RECORD FOR A CATEGORY
 */
router.get('/wr/category/:category_id', cache(cache_value), function (req, res_, next) {
    speedruncom.getWorldRecord(req.params.category_id, function (data) {
        res_.json(data);
    })
});

/**
 * RETURNS WORLD RECORDS FOR A GAME
 */
router.get('/wr/game/:game', /*cache(cache_value),*/ function (req, res_, next) {
    speedruncom.findGame(req.params.game, function (data) {
        if (data) {
            promises = [];

            for (var c in data.categories.data) {
                var category = data.categories.data[c];
                if (category.type === "per-game" && category.miscellaneous === false) {
                    promises.push(speedruncom.PromiseGetCategoryRecord(category.id));
                }
            }

            Promise.all(promises).then(function (results) {
                res_.json(results);
            }).catch(function (e) {
                // Handle errors here
                console.log(e);
                res_.json({err: e});
            });
        }
    });
});


module.exports = router;
