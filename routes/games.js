var express = require('express');
var router = express.Router();
var speedruncom = require('../bin/speedruncom');

var _games = require('../config.json');

router.get('/:game', function (req, res, next) {
    var game = false;
    if (req.params.game) {
        if (req.params.game in _games) {
            game = _games[req.params.game].abbreviation;
        }
    }

    if (!game) {
        res.render('leaderboards', {
            title: 'Game not found',
            game_id: '',
            game_abbreviation: '',
            categories: [],
            default_category: '',
            games: []
        });
        res.stop();
    } else {
        // TODO Remove hard coded game
        speedruncom.findGame(game, function (game) {
            var categories = [];

            if (game) {
                for (var c in game.categories.data) {
                    if (game.categories.data.hasOwnProperty(c)) {
                        var category = game.categories.data[c];
                        if (category.type === 'per-game') {
                            categories[category.id] = {
                                name: category.name,
                                misc: category.miscellaneous,
                                abbreviation: category.weblink.split('#')[1]
                            }
                        }
                    }
                }

                var default_category;
                for (var c in categories) {
                    default_category = categories[c].abbreviation;
                    break;
                }

                res.render('leaderboards', {
                    title: game.names.international,
                    game_id: game.id,
                    game_abbreviation: game.abbreviation,
                    categories: categories,
                    default_category: default_category,
                    games: _games,
                    variables: game.variables.data
                });
            }
        });
    }
});

module.exports = router;