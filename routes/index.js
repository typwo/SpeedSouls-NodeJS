var express = require('express');
var router = express.Router();
var speedruncom = require('../bin/speedruncom');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Speedsouls'});
});

module.exports = router;
