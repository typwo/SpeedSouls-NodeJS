$(document).ready(function () {
    // ----------------------------------  ON LOAD  ---------------------------------- //
    var category_select = $('#categoriesTab');
    var game_id = category_select.attr('data-game-abbreviation');
    var default_category_id = category_select.attr('data-default-category');
    var category = default_category_id;

    // If category in the URL
    if (window.location.hash) {
        category = window.location.hash.replace('#', '');
    }

    // Build the subcategories if needed
    buildSubCategoriesSelects(game_id, category, default_category_id, function (data) {
        console.log(data);
        $('.sub-categories-div').html(data.html);

        // Update the category
        updateCategory(category_select, game_id, category);
    });

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

    // When subcategory is changed
    $('.sub-categories-div').on('change', 'select', function () {
        var category_id = $('#categoriesTab').find('.nav-category, .dropdown-menu').find('.category.active').first().attr('data-abbreviation');
        updateCategory(category_select, game_id, category_id);
    });
});


/* ---------- FUNCTIONS ---------- */
/**
 * Returns the leaderboards data from our own API
 */
function getLeaderboards(game_id, category_id, sub_category, callback) {
    // Url Params
    var params = {
        game: game_id,
        category: category_id
    };

    if (sub_category !== {}) {
        var query = []
        for (var subc in sub_category) {
            query.push('var-' + subc + '=' + sub_category[subc]);
        }
        params['vars'] = query.join(',');
    }

    var url = '/api/leaderboards?' + $.param(params);
    // Get leaderboards for the category

    $.getJSON(url, function (leaderboards_data) {
        callback(leaderboards_data);
    });
}

/**
 * Updates the leaderboards
 */
function updateLeaderboards(game_id, category_id, sub_category, callback) {
    // Gets the leaderads
    getLeaderboards(game_id, category_id, sub_category, function (leaderboards_data) {
        /**
         * SPEEDRUN.COM BUG
         * Get the amount of runs on the leaderboards using the correct primary timing method
         */

        var l = leaderboards_data;

        // Bug only present on RTA no loads leaderboards
        if (l.headers.default_timing === "realtime_noloads") {

            console.log(l);
            // Get the category DATA from our own API
            getSpeedrunComCategoryNoLoadRunsNumber(
                l.headers.game.abbreviation,
                category_id,
                function (bugged_total_no_load_runs) {

                    // Builds the HTML
                    _updateLeaderboards(l, bugged_total_no_load_runs, function (table) {
                        callback(table);
                    });
                }
            );
        } else {
            // Builds the HTML
            _updateLeaderboards(l, 0, function (table) {
                callback(table);
            });
        }

        /**
         * The function that actually builds the HTML and fill the leaderboards div
         */
        function _updateLeaderboards(leaderboards_data, bugged_number, callback) {
            console.log(leaderboards_data);
            var div = $('<div></div>');
            // if (leaderboards_data.variables.length > 0) {
            //     var sub_category_div = $('<div></div>').addClass('sub-categories-div');
            //     for (var i in leaderboards_data.variables) {
            //         var scategory = leaderboards_data.variables[i];
            //         if (scategory['is-subcategory']) {
            //
            //             var sub_categories_list = $('<div></div>').addClass('dropdown-menu').attr('aria-labelledby', 'dropdownMenuButton');
            //             for (var ayylmao in scategory.values.values) {
            //                 sub_categories_list.append(
            //                     $('<a></a>').addClass('dropdown-item').attr(
            //                         {
            //                             'data-subcategory-id': ayylmao,
            //                             'href': '#'
            //                         }
            //                     ).text(
            //                         scategory.values.values[ayylmao].label
            //                     )
            //                 )
            //             }
            //
            //             var sub_category_select = $('<div></div>')
            //                 .addClass('dropdown')
            //                 .append(
            //                     $('<button></button>').addClass('btn btn-secondary dropdown-toggle').attr({
            //                         'id': 'dropdownMenuButton',
            //                         'aria-haspopup': "true",
            //                         'aria-expanded': "false",
            //                         'type': 'button',
            //                         'data-toggle': 'dropdown'
            //                     }).text(
            //                         scategory.name
            //                     ).append(
            //                         sub_categories_list
            //                     )
            //                 );
            //             sub_category_div.append(sub_category_select);
            //         }
            //     }
            //     div.append(sub_category_div);
            // }

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
                $($('<th></th>').addClass('d-none d-md-table-cell').text(leaderboards_data.headers.primary_name))
            );

            // Second timing method
            if (leaderboards_data.headers.secondary_name !== undefined) {
                thead.append(
                    $($('<th></th>').addClass('d-none d-md-table-cell').text(leaderboards_data.headers.secondary_name))
                );
            }

            // Time column for responsive tables
            thead.append(
                $($('<th></th>').addClass('d-md-none').text('Time'))
            );

            // Variables
            for (var variable_i in leaderboards_data.variables) {
                if (!leaderboards_data.variables[variable_i]['is-subcategory']) {
                    thead.append(
                        $($('<th></th>').addClass('d-none d-md-table-cell').text(leaderboards_data.variables[variable_i].name))
                    );
                }
            }

            thead.append(
                $($('<th></th>').addClass('d-none d-md-table-cell').text('Platform')),
                $($('<th></th>').addClass('d-none d-md-table-cell').text('VOD'))
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
                     * SPEEDRUN.COM BUG FIX
                     * If the category is using RTA No load and the run doesn't have a primary time, then we use the
                     * secondary value as the primary one
                     */
                    if (
                        leaderboards_data.headers.default_timing === 'realtime_noloads' &&
                        run.primary === "" &&
                        r < bugged_number
                    ) {
                        row.append(
                            $('<td></td>').addClass('d-none d-md-table-cell').text(run.secondary)
                        );
                        row.append(
                            $('<td></td>').addClass('d-none d-md-table-cell').text("")
                        );
                    }
                    // Show the times normally
                    else {
                        row.append(
                            $('<td></td>').addClass('d-none d-md-table-cell').text(run.primary)
                        );

                        // Second timing method
                        if (leaderboards_data.headers.secondary_name !== undefined) {
                            row.append(
                                $('<td></td>').addClass('d-none d-md-table-cell').text(run.secondary)
                            );
                        }
                    }

                    // Time column for responsive tables
                    if (run.primary !== "") {
                        row.append(
                            $('<td></td>').addClass('d-md-none').text(run.primary)
                        );
                    } else {
                        row.append(
                            $('<td></td>').addClass('d-md-none').text(run.secondary)
                        );
                    }

                    // Variables
                    for (var var_global_i in leaderboards_data.variables) {
                        if (
                            !leaderboards_data.variables[var_global_i]['is-subcategory']
                        ) {
                            var var_label = '';
                            for (var var_run_i in run.variables) {
                                if (
                                    leaderboards_data.variables[var_global_i].id === var_run_i
                                ) {
                                    for (var value in leaderboards_data.variables[var_global_i].values.values) {
                                        if (run.variables[var_run_i] === value) {
                                            var_label = leaderboards_data.variables[var_global_i].values.values[value].label;
                                        }
                                    }
                                }
                            }
                            row.append(
                                $('<td></td>').addClass('d-none d-md-table-cell').text(
                                    var_label
                                )
                            );
                        }
                    }

                    // Platform
                    if (consoles[run.platform] !== undefined) {
                        row.append(
                            $('<td></td>').addClass('d-none d-md-table-cell').attr('title', run.platform).text(consoles[run.platform])
                        );
                    } else {
                        row.append(
                            $('<td></td>').addClass('d-none d-md-table-cell').text(run.platform)
                        );
                    }

                    // VOD
                    if (run.video === undefined) {
                        row.append(
                            $('<td></td>').addClass('d-none d-md-table-cell').text(' ')
                        );
                        row.attr('data-video', run.weblink);
                    } else {
                        row.append(
                            $('<td></td>').addClass('d-none d-md-table-cell').html(faw_video)
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
                        'There are no runs.'
                    )
                );
            }

            // Append everything together
            table.append(tbody);
            div.append(table);

            // We're done m8
            callback(div);
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
    game = decodeURIComponent(game);
    category = decodeURIComponent(category);
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
    var default_category_id = div_categories.attr('data-default-category');

    // Find the new tab
    var category = div_categories.find(
        "a[data-category-id='" + id_or_abbreviation + "'], " +
        "a[data-abbreviation='" + id_or_abbreviation + "']"
    );

    console.log(category);

    // If tab not found, use the default
    if (category.length === 0) {
        category = div_categories.find(
            "a[data-abbreviation='" + default_category_id + "']"
        );
        id_or_abbreviation = default_category_id;
    }

    // Disable categories buttons
    div_categories.find('li.nav-category, li.dropdown').each(function () {
        $(this).find('a').addClass('disabled');
    });

    $('.sub-categories-div').find('select').each(function () {
        $(this).prop('disabled', 'disabled');
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

    // Get selected sub categories if any
    var sub_categories_div = $('.sub-categories-div');
    var sub_categories_selected_values = {};
    sub_categories_div.find('select').each(function () {
        sub_categories_selected_values[$(this).attr('data-var-id')] = this.value;
    });

    // Updates the leaderboards
    updateLeaderboards(game_id, id_or_abbreviation, sub_categories_selected_values, function (table) {
        $('#leaderboards').empty().append(table);
        // When the leaderboards are updated, we enable categories buttons again
        div_categories.find('li.nav-category, li.dropdown').each(function () {
            $(this).find('a').removeClass('disabled');
        });

        $('.sub-categories-div').find('select').each(function () {
            $(this).prop('disabled', false);
        });
    });

}

/**
 * Builds the sub categories selects
 */
function buildSubCategoriesSelects(game_id, id_or_abbreviation, default_category, callback) {
    url = '/api/games/' + game_id + '/category/' + id_or_abbreviation;
    console.log(url);
    $.getJSON(url, function (data) {

        console.log(data);
        if (data !== 404) {
            url = '/api/games/' + game_id + '/category/' + default_category;
            $.getJSON(url, function (data) {
                x(data, function (output) {
                    callback(output);
                })
            });
        } else {
            x(data, function (output) {
                callback(output);
            })
        }

    });

    function x(d, cb) {
        var output = {};
        var sub_categories = {};
        var sub_category_div = $('<div></div>');
        for (var i in d.variables.data) {
            var scategory = d.variables.data[i];
            if (scategory['is-subcategory']) {
                var select = $('<select></select>').addClass('custom-select').attr('data-var-id', scategory.id);

                for (var ayylmao in scategory.values.values) {
                    select.append(
                        $('<option></option>').attr(
                            {
                                'value': ayylmao
                            }
                        ).text(
                            scategory.values.values[ayylmao].label
                        )
                    )
                }
                sub_category_div.append(select);
            }
        }
        output.sub_category = sub_categories;
        output.html = sub_category_div;
        cb(output);
    }
}
