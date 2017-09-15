var express = require('express');
var router = express.Router();
var speedruncom = require('../bin/speedruncom');

var _games = require('../config.json');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Speedsouls', games: _games});
});

module.exports = router;
