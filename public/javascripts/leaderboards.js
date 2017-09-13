$(document).ready(function () {
    // ----------------------------------  FUNCTIONS  ---------------------------------- //
    /**
     * The function that actually builds the HTML and fill the leaderboards div
     */
    function _updateLeaderboards(leaderboards_data, bugged_number, callback) {
        // Get the main leaderboards div
        var div = $('#leaderboards');

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

        // Creates the naim table
        var table = $('<table></table>').addClass('table table-sm table-hover');

        // header
        var thead = $('<thead></thead>').append(
            $($('<th></th>').text('Rank')),
            $($('<th></th>').text('Runner')),
            $($('<th></th>').text(leaderboards_data.headers.primary_name))
        );

        // Second timing method
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

        // Appends the head tp the table
        table.append(thead);

        // tbody
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
                    // If has an account
                    if (player.weblink !== '') {
                        var element = $('<a></a>').addClass('player-weblink').attr(
                            {
                                'href': player.weblink,
                                'target': '_blank'
                            }
                        ).text(player.name);
                        // Gets the HTML so we can players_output.join() later
                        var html = $("<div />").append($(element).clone()).html();
                        players_output.push(html);
                    }
                    // Guest
                    else {
                        players_output.push(player.name)
                    }
                }

                // Appends the player(s)
                row.append(
                    $('<td></td>').append(
                        players_output.join(' & ')
                    )
                );

                /**
                 * If the category is using RTA No load and the run doesn't have a primary time, then we use the
                 * secondary value as the primary one
                 */
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
                }
                // Show the times normally
                else {
                    row.append(
                        $('<td></td>').text(run.primary)
                    );

                    // Second timing method
                    if (leaderboards_data.headers.secondary_name !== undefined) {
                        row.append(
                            $('<td></td>').text(run.secondary)
                        );
                    }
                }

                // Variables
                for (var variable_i in leaderboards_data.variables) {
                    if (leaderboards_data.variables.hasOwnProperty(variable_i)) {
                        row.append(
                            $('<td></td>').text(run[variable_i])
                        );
                    }
                }

                // Platform
                if (consoles[run.platform] !== undefined) {
                    row.append(
                        $('<td></td>').attr('title', run.platform).text(consoles[run.platform])
                    );
                } else {
                    row.append(
                        $('<td></td>').text(run.platform)
                    );
                }

                // VOD
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

                // Append the row to the body
                tbody.append(row);
            }
        }
        // No runs
        else {
            var colspan = $(thead).children('th').length;
            tbody.append(
                $('<td></td>').attr('colspan', colspan).addClass('empty-row').text(
                    'There is no runs.'
                )
            );
        }

        // Append everything together
        table.append(tbody);
        div.empty();
        div.append(table);

        // We're done m8
        callback();
    }

    /**
     * Returns the leaderboards data from our own API
     */
    function getLeaderboards(game_id, category_id, callback) {
        // Url Params
        var params = {
            game: game_id,
            category: category_id
        };
        var url = '/api/leaderboards?' + $.param(params);
        // Get leaderboards for the category

        $.getJSON(url, function (leaderboards_data) {
            callback(leaderboards_data);
        });
    }

    /**
     * Updates the leaderboards
     */
    function updateLeaderboards(game_id, category_id, default_category_id, callback) {
        // Gets the leaderads
        getLeaderboards(game_id, category_id, function (leaderboards_data) {
            // If category not found, we use the default category
            if (leaderboards_data.statusCode === 404) {
                // Gets the leaderboards again
                getLeaderboards(game_id, default_category_id, function (default_leaderboards) {
                    // Keeps going
                    x(default_leaderboards, callback);
                })
            } else {
                // Keeps going
                x(leaderboards_data, callback);
            }
        });

        function x(l, l_callback) {
            /**
             * SPEEDRUN.COM BUG
             * Get the amount of runs on the leaderboards using the correct primary timing method
             */

            // Bug only present on RTA no loads leaderboards
            if (l.headers.default_timing === "realtime_noloads") {
                // Get the category DATA from our own API
                getSpeedrunComCategoryNoLoadRunsNumber(
                    l.headers.game.abbreviation,
                    category_id,
                    function (bugged_total_no_load_runs) {
                        // Builds the HTML
                        _updateLeaderboards(l, bugged_total_no_load_runs, function () {
                            l_callback();
                        });
                    }
                );
            } else {
                // Builds the HTML
                _updateLeaderboards(l, 0, function () {
                    l_callback();
                });
            }
        }
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

    /**
     * Update the category tabs and call the functions to update the leaderboards
     */
    function updateCategory(div_categories, game_id, id_or_abbreviation) {
        // Default category
        var default_category_id = category_select.attr('data-default-category');

        // Find the new tab
        var category = div_categories.find(
            "a[data-category-id='" + id_or_abbreviation + "'], " +
            "a[data-abbreviation='" + id_or_abbreviation + "']"
        );

        // If tab not found, use the default
        if(category.length === 0) {
            category = div_categories.find(
                "a[data-abbreviation='" + default_category_id + "']"
            );
        }

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
            updateLeaderboards(game_id, id_or_abbreviation, default_category_id, function () {
                // When the leaderboards are updated, we enable categories buttons again
                div_categories.find('li.nav-category, li.dropdown').each(function () {
                    $(this).find('a').removeClass('disabled');
                });
            });
        }
    }

    // ----------------------------------  ON LOAD  ---------------------------------- //

    // On load
    var category_select = $('#categoriesTab');
    var game_id = category_select.attr('data-game-abbreviation');
    var default_category_id = category_select.attr('data-default-category');

    // If category in the URL
    if (window.location.hash) {
        default_category_id = window.location.hash.replace('#', '');
    }

    // Update the category
    updateCategory(category_select, game_id, default_category_id);



    // ----------------------------------  EVENTS  ---------------------------------- //
    // When a row / run is clicked
    $(document).on('click', 'div#leaderboards table tr', function () {
        window.open($(this).attr('data-video'), '_blank');
    });

    // When the player's name is clicked
    $(document).on('click', '.player-weblink', function (e) {
        // Prevents the row on click to trigger
        e.stopPropagation();
    });

    // When category is changed
    $('ul#categoriesTab .category').on('click', function () {
        updateCategory(category_select, game_id, $(this).attr('data-abbreviation'));
    });
});
