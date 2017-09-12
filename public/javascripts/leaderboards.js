$(document).ready(function () {
    function _updateLeaderboards(leaderboards_data, bugged_number, callback) {
        // Loading spinner

        // Get the main leaderboards div
        var div = $('#leaderboards');

        // Replace the content by the spinner
        // Console names
        var consoles = {
            'PlayStation 4': 'PS4',
            'Nintendo Entertainment System': 'NES',
            'Famicom Disk System': 'FDS',
            'Wii Virtual Console': 'Wii VC',
            'PlayStation 3': 'PS3',
            'Nintendo 64': 'N64'
        };

        // Font-awesome video icon
        var faw_video = '<i class="fa fa-video-camera" aria-hidden="true"></i>';

        var table = $('<table></table>').addClass('table table-sm table-hover');

        // header
        var thead = $('<thead></thead>').append(
            $($('<th></th>').text('Rank')),
            $($('<th></th>').text('Runner')),
            $($('<th></th>').text(leaderboards_data.headers.primary_name))
        );

        if (leaderboards_data.headers.secondary_name !== undefined) {
            thead.append(
                $($('<th></th>').text(leaderboards_data.headers.secondary_name))
            );
        }

        // Variables
        for (var variable_i in leaderboards_data.variables) {
            if (leaderboards_data.variables.hasOwnProperty(variable_i)) {
                thead.append(
                    $($('<th></th>').text(leaderboards_data.variables[variable_i]))
                );
            }
        }

        thead.append(
            $($('<th></th>').text('Platform')),
            $($('<th></th>').text('VOD'))
        );

        table.append(thead);

        var tbody = $('<tbody></tbody>');
        if (leaderboards_data.runs.length > 0) {
            for (var r in leaderboards_data.runs) {
                var run = leaderboards_data.runs[r];
                var row = $('<tr></tr>').addClass('run').append(
                    $('<td></td>').text(run.rank)
                );

                // Player(s)
                var players_output = [];
                for (var p in run.players) {
                    var player = run.players[p];
                    if (player.weblink !== '') {
                        var element = $('<a></a>').addClass('player-weblink').attr(
                            {
                                'href': player.weblink,
                                'target': '_blank'
                            }
                        ).text(player.name);
                        var html = $("<div />").append($(element).clone()).html();
                        players_output.push(html);
                    } else {
                        players_output.push(player.name)
                    }
                }

                row.append(
                    $('<td></td>').append(
                        players_output.join(' & ')
                    )
                );


                // BUG FIX
                if (
                    leaderboards_data.headers.default_timing === 'realtime_noloads' &&
                    run.primary === "" &&
                    r < bugged_number
                ) {
                    row.append(
                        $('<td></td>').text(run.secondary)
                    );
                    row.append(
                        $('<td></td>').text("")
                    );
                } else {
                    row.append(
                        $('<td></td>').text(run.primary)
                    );

                    row.append(
                        $('<td></td>').text(run.secondary)
                    );
                }

                for (var variable_i in leaderboards_data.variables) {
                    if (leaderboards_data.variables.hasOwnProperty(variable_i)) {
                        row.append(
                            $('<td></td>').text(run[variable_i])
                        );
                    }
                }

                if (consoles[run.platform] !== undefined) {
                    row.append(
                        $('<td></td>').attr('title', run.platform).text(consoles[run.platform])
                    );
                } else {
                    row.append(
                        $('<td></td>').text(run.platform)
                    );
                }

                if (run.video === undefined) {
                    row.append(
                        $('<td></td>').text(' ')
                    );
                    row.attr('data-video', run.weblink);
                } else {
                    row.append(
                        $('<td></td>').html(faw_video)
                    );
                    row.attr('data-video', run.video);
                }

                tbody.append(row);
            }
        } else {
            var colspan = $(thead).children('th').length;
            // No runs
            tbody.append(
                $('<td></td>').attr('colspan', colspan).addClass('empty-row').text(
                    'There is no runs.'
                )
            );
        }
        table.append(tbody);
        div.empty();
        div.append(table);
        callback();
    }

    /**
     * BUILDS THE LEADERBOARDS
     * From a game and a category
     */
    function updateLeaderboards(game_id, category_id, callback) {
        // Url Params
        var params = {
            game: game_id,
            category: category_id
        };
        var url = '/api/leaderboards?' + $.param(params);
        // Get leaderboards for the category
        $.getJSON(url, function (leaderboards_data) {
            /**
             * SPEEDRUN.COM BUG
             * Get the amount of runs on the leaderboards using the correct primary timing method
             */
            if (leaderboards_data.headers.default_timing === "realtime_noloads") {
                // Get the category DATA from our own API
                getSpeedrunComCategoryNoLoadRunsNumber(
                    leaderboards_data.headers.game.abbreviation,
                    category_id,
                    function (bugged_total_no_load_runs) {
                        _updateLeaderboards(leaderboards_data, bugged_total_no_load_runs, function () {
                            callback();
                        });
                    }
                );
            } else {
                _updateLeaderboards(leaderboards_data, 0, function () {
                    callback();
                });
            }
        });
    }

    /**
     * RETURNS THE CATEGORIES FROM SPEEDRUN.COM GAME PAGE
     */
    function getSpeedrunComCats(game, callback) {
        $.getJSON('/api/speedruncom-cats/' + game, function (a, b) {
            if (a.data !== null) {
                eval(a.data);
                callback(cats);
            } else {
                callback(false);
            }
        })
    }

    /**
     * RETURNS THE CATEGORIES FROM SPEEDRUN.COM GAME PAGE
     */
    function getSpeedrunComCategoryNoLoadRunsNumber(game, category, callback) {
        getSpeedrunComCats(game, function (e) {
            for (var c in e) {
                if (e[c] === category) {
                    $.getJSON('/api/speedruncom-leaderboards/' + game + '/' + c, function (a, b) {
                        var total = 0;
                        if (a.data !== null) {
                            var tempDom = $('<output>').append($.parseHTML(a.data));
                            var body = $('tbody', tempDom);
                            $(body).children('tr').each(function () {
                                if ($(this).find('td:nth-child(3)').text() !== '') {
                                    total++;
                                }
                            });
                            callback(total);
                        } else {
                            callback(false);
                        }
                    })
                }
            }
        })
    }


    function updateCategory(div_categories, game_id, id_or_abbreviation) {
        // Find the new tab
        var category = div_categories.find(
            "a[data-category-id='" + id_or_abbreviation + "'], " +
            "a[data-abbreviation='" + id_or_abbreviation + "']"
        );

        // If category not already selected
        if (!category.hasClass('active')) {
            // Disable categories buttons
            div_categories.find('li.nav-category, li.dropdown').each(function () {
                $(this).find('a').addClass('disabled');
            });


            function getSpinner() {
                return $('<div></div>').addClass('loader');
            }

            $('#leaderboards').html(getSpinner());

            // Remove all active
            div_categories.find('.category').each(function () {
                $(this).removeClass('active');
            });
            div_categories.find('.dropdown-toggle').removeClass('active');


            // Activate the tab
            category.addClass('active');
            // Activate the misc tab if needed
            if (category.parent().hasClass('dropdown-menu')) {
                div_categories.find('.dropdown-toggle').addClass('active');
            }

            // Updates the leaderboards
            updateLeaderboards(game_id, id_or_abbreviation, function () {
                // Enable categories buttons
                div_categories.find('li.nav-category, li.dropdown').each(function () {
                    $(this).find('a').removeClass('disabled');
                });
            });
        }
    }


    // On load
    var category_select = $('#categoriesTab');
    var game_id = category_select.attr('data-game-id');
    var default_category_id = category_select.attr('data-default-category');


    if (window.location.hash) {
        default_category_id = window.location.hash.replace('#', '');
    }
    updateCategory(category_select, game_id, default_category_id);

    $(document).on('click', 'div#leaderboards table tr', function () {
        window.open($(this).attr('data-video'), '_blank');
    });

    $(document).on('click', '.player-weblink', function (e) {
        e.stopPropagation();
    });

    // Categories select
    $('ul#categoriesTab .category').on('click', function () {
        updateCategory(category_select, game_id, $(this).attr('data-abbreviation'));
    });
});
