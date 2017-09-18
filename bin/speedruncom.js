var api_url = 'http://www.speedrun.com/api/v1';
var rp = require('request-promise');
var moment = require('moment');

var local_timing_methods = {
    realtime: 'Real Time',
    realtime_noloads: 'Real Time no Load',
    ingame: 'In-game Time'
};

function encodeQueryData(data) {
    var ret = [];
    for (var d in data)
        ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
    var output = ret.join('&');

    if (output.length > 0) {
        output = '?' + output;
    }

    return output;
}

function formatTime(time) {
    var ms = time.toString().split('.').length > 1;
    if (time !== 0) {
        var moment_t = moment.duration(time, 'seconds');
        var format = '';
        if (moment_t.hours() > 0) {
            if (ms) {
                format = "H:mm:ss.SSS";
            } else {
                format = "H:mm:ss";
            }
        } else {
            if (ms) {
                format = "mm:ss.SSS";
            } else {
                format = "mm:ss";
            }
        }

        return moment.utc(time * 1000).format(format);
    } else {
        return '';
    }
}

function buildUrl(url, params) {
    params === undefined ? params = [] : '';
    return api_url + url + encodeQueryData(params);
}

function buildRun(run) {

}

module.exports = {
    getLeaderboards: function (game_id, category_id, vars, callback) {
        var params = {
            //'top': 50,
            'embed': 'players,game,variables,platforms'
        };

        if (vars !== {}) {
            var splits = vars.split(',');
            for (var s in splits) {
                var subsplits = splits[s].split('=');
                for (var ss in subsplits) {
                    params[subsplits[0]] = subsplits[1];
                }
            }
        }

        var url = buildUrl(
            '/leaderboards/' + game_id + '/category/' + category_id,
            params
        );

        var options = {
            uri: url,
            json: true
        };

        rp(options)
            .then(function (json) {
                var game = json.data.game.data;
                var platforms = json.data.platforms.data;

                // Timing methods
                var timings = game.ruleset['run-times'];
                var default_timing = game.ruleset['default-time'];

                var headers = {};
                headers.default_timing = default_timing;
                headers.game = game;
                for (var t_1 in timings) {
                    if (timings[t_1] === default_timing) {
                        // Primary
                        headers.primary_name = local_timing_methods[default_timing];
                    } else {
                        // Secondary (if any)
                        headers.secondary_name = local_timing_methods[timings[t_1]];
                    }
                }

                // Variables
                var variables = json.data.variables.data;

                // Runs
                var runs = [];
                for (var r in json.data.runs) {
                    if (json.data.runs.hasOwnProperty(r)) {
                        var run = json.data.runs[r];
                        var tmp = {};

                        // headers.category = run;

                        // Rank
                        tmp.rank = run.place;

                        // Player(s)
                        var players_count = run.run.players.length;
                        var players_xd = [];
                        for (
                            var index = ((parseInt(r) + 1) * players_count) - 1;
                            index > (((parseInt(r) + 1) * players_count) - 1) - players_count;
                            index--
                        ) {
                            var _player = json.data.players.data[index];
                            players_xd.push({
                                    name: _player.names === undefined ? _player.name : _player.names.international,
                                    weblink: _player.weblink !== undefined ? _player.weblink : ''
                                }
                            );
                        }

                        tmp.players = players_xd;

                        // Timing methods
                        var local_timings = timings;
                        for (var t in local_timings) {
                            if (local_timings[t] === default_timing) {
                                // Primary
                                tmp.primary = formatTime(run.run.times[local_timings[t] + '_t']);
                            } else {
                                // Secondary (if any)
                                var secondary_t = run.run.times[local_timings[t] + '_t'];
                                tmp.secondary = formatTime(secondary_t);
                            }
                        }


                        // Platform
                        for (var p in platforms) {
                            if (platforms[p].id === run.run.system.platform) {
                                tmp.platform = platforms[p].name;
                                break;
                            }
                        }

                        // Variables
                        tmp.variables = run.run.values;

                        // VOD
                        if (run.run.videos !== null) {
                            if (run.run.videos.links !== undefined && run.run.videos.links.length === 1) {
                                tmp.video = run.run.videos.links[0].uri;
                            } else {
                                tmp.video = run.run.weblink;
                            }
                        }

                        // Weblink
                        tmp.weblink = run.run.weblink;

                        // Push the run
                        runs.push(tmp);
                    }
                }

                leaderboards = {
                    headers: headers,
                    variables: variables,
                    runs: runs
                };

                callback(leaderboards);
            })
            .catch(function (err) {
                // Crawling failed...
                callback(err);
            })
    },

    findGame: function (game_name, callback) {
        var url = buildUrl(
            '/games',
            {
                'name': game_name,
                'embed': 'categories,variables'
            }
        );

        findGamePerUrl(url, function (data) {
            callback(data);
        });

        function findGamePerUrl(url, findGame_callback) {

            var options = {
                uri: url,
                json: true
            };

            rp(options)
                .then(function (json) {
                    var next = false;
                    for (var l in json.pagination.links) {
                        if (json.pagination.links[l].rel === 'next') {
                            next = true;
                            findGamePerUrl(json.pagination.links[l].uri, findGame_callback);
                        }
                    }

                    for (var g in json.data) {
                        if (json.data.hasOwnProperty(g)) {
                            var game = json.data[g];
                            if (
                                game.names.twitch === game_name ||
                                game.names.japanese === game_name ||
                                game.names.twitch === game_name ||
                                game.abbreviation === game_name
                            ) {
                                // Found the game!
                                findGame_callback(game);
                            }
                        }
                    }

                    if (next === false) {
                        callback(false);
                    }
                })
                .catch(function (err) {
                    // Crawling failed...
                    console.log(err);
                    callback(err);
                })
        }
    },
    
    PromiseGetCategoryRecord: function (category_id) {
        return new Promise(function (resolve) {
            var url = buildUrl(
                '/categories/' + category_id + '/records',
                {
                    'top': 1,
                    'embed': 'players,category'
                }
            );

            var options = {
                uri: url,
                json: true
            };

            rp(options)
                .then(function (json) {
                    var category = json.data[0].category;
                    var run = json.data[0].runs[0].run;
                    var players = json.data[0].players.data;

                    // Player(s)
                    var players_xd = [];
                    for (var p in players) {
                        var _player = players[p];
                        players_xd.push({
                                name: _player.names === undefined ? _player.name : _player.names.international,
                                weblink: _player.weblink !== undefined ? _player.weblink : ''
                            }
                        );
                    }


                    // Runs info
                    run_data = {
                        weblink: run.weblink,
                        primary: formatTime(run.times['primary_t'])
                    };

                    record = {
                        category: category.data,
                        players: players_xd,
                        runs: run,
                        runs_d: run_data
                    };
                    resolve(record);
                })
                .catch(function (err) {
                    // Crawling failed...
                    console.log(err);
                    resolve(err);
                })
        });
    },

    findCategory: function (game, category, callback) {
        var url = buildUrl(
            '/games/' + game + '/categories', //category,
            {
                'embed': 'variables'
            }
        );

        var options = {
            uri: url,
            json: true
        };

        rp(options)
            .then(function (json) {
                var found = false;
                for (var c in json.data) {
                    if (
                        json.data[c].id === category ||
                        json.data[c].name === category ||
                        json.data[c].weblink.split('#')[1] === category
                    ) {
                        found = true;
                        callback(json.data[c]);
                    }
                }
                if (!found) {
                    callback({
                        data: 404
                    });
                }
            })
            .catch(function (err) {
                // Crawling failed...
                callback(err);
            })

    },
    
    getWorldRecord: function (category_id, callback) {
        var url = buildUrl(
            '/categories/' + category_id + '/records',
            {
                embed: 'players'
            }
        );

        var options = {
            uri: url,
            json: true
        };

        rp(options)
            .then(function (json) {
                var runs = json.data[0].runs;
                console.log(runs);
                callback(json)
            })
            .catch(function (err) {
                // Crawling failed...
                console.log(err);
                callback(err);
            });

    }
};