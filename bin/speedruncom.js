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

module.exports = {
    getLeaderboards: function (game_id, category_id, callback) {
        var url = buildUrl(
            '/leaderboards/' + game_id + '/category/' + category_id,
            {
                //'top': 50,
                'embed': 'players,game,variables,platforms'
            }
        );
        var options = {
            uri: url,
            json: true
        };

        console.log(url);

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
                var variables = {};
                for (var v in json.data.variables.data) {
                    if (json.data.variables.data.hasOwnProperty(v)) {
                        var variable = json.data.variables.data[v];
                        if (variable['is-subcategory'] === false) {
                            variables[variable.id] = variable.name;
                        }
                    }
                }

                // Runs
                var runs = [];
                for (var r in json.data.runs) {
                    if (json.data.runs.hasOwnProperty(r)) {
                        var run = json.data.runs[r];
                        var player = json.data.players.data[r];
                        var tmp = {};

                        headers.category = run;

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
                        for (var index in run.run.values) {
                            if (run.run.values.hasOwnProperty(index)) {
                                var value = run.run.values[index];
                                for (var jindex in json.data.variables.data) {
                                    if (json.data.variables.data.hasOwnProperty(jindex)) {
                                        variable = json.data.variables.data[jindex];
                                        if (variable.id === index && index in variables) {
                                            tmp[variable.id] = variable.values.values[value].label;
                                        }
                                    }
                                }
                            }
                        }

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
                'embed': 'categories'
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
                    callback(err);
                })
        }
    },

    findCategory: function (game, category, callback) {
        var url = buildUrl(
            '/games/' + game + '/categories', //category,
            {}
        );

        var options = {
            uri: url,
            json: true
        };

        rp(options)
            .then(function (json) {
                for (var c in json.data) {
                    if (
                        json.data[c].id === category ||
                        json.data[c].name === category ||
                        json.data[c].weblink.split('#')[1] === category
                    ) {
                        callback(json.data[c]);
                    }
                }
            })
            .catch(function (err) {
                // Crawling failed...
                callback(err);
            })

    }
};