var express = require('express');
var router = express.Router();
var speedruncom = require('../bin/speedruncom');

var soulsgames = {
    'bloodborne': {
        'name': 'Bloodborne',
        'abbreviation': 'Bloodborne'
    },
    'darksouls': {
        'name': 'Dark Souls',
        'abbreviation': 'Dark_Souls'
    },
    'darksouls2': {
        'name': 'Dark Souls II',
        'abbreviation': 'ds2'
    },
    'darksouls2sotfs': {
        'name': 'Dark Souls II: Scholar of the First Sin',
        'abbreviation': 'ds2sotfs'
    },
    'darksouls3': {
        'name': 'Dark Souls III',
        'abbreviation': 'dks3'
    },
    'demonssouls': {
        'name': 'Demon\'s Souls',
        'abbreviation': 'Demons_Souls'
    }
};

router.get('/:game', function (req, res, next) {
    var game = false;
    if (req.params.game) {
        if (req.params.game in soulsgames) {
            game = soulsgames[req.params.game].abbreviation;
        }
    }

    console.log(game);

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
        speedruncom.findGame('botw', function (game) {
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

                console.log(game.variables.data);

                res.render('leaderboards', {
                    title: game.names.international,
                    game_id: game.id,
                    game_abbreviation: game.abbreviation,
                    categories: categories,
                    default_category: default_category,
                    games: soulsgames,
                    variables: game.variables.data
                });
            }
        });
    }
});

module.exports = router;