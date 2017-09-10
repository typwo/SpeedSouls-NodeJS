$(document).ready(function () {
    function buildLeaderboards(game_id, category_id) {
        function getSpinner() {
            return $('<div></div>').addClass('loader');
        }
        var div = $('#leaderboards');
        div.html(getSpinner());
        var params = {
            game: game_id,
            category: category_id
        };

        var consoles = {
            'PlayStation 4': 'PS4',
            'Nintendo Entertainment System': 'NES',
            'Famicom Disk System': 'FDS',
            'Wii Virtual Console': 'Wii VC',
            'PlayStation 3': 'PS3',
            'Nintendo 64': 'N64'
        };

        var faw_video = '<i class="fa fa-video-camera" aria-hidden="true"></i>';
        var url = '/api/leaderboards?' + $.param(params);

        $.getJSON(url, function (data) {
            var table = $('<table></table>').addClass('table table-sm table-hover');

            // header
            var thead = $('<thead></thead>').append(
              $($('<th></th>').text('Rank')),
              $($('<th></th>').text('Runner')),
              $($('<th></th>').text(data.headers.primary_name))
            );

            if (data.headers.secondary_name !== undefined) {
                thead.append(
                    $($('<th></th>').text(data.headers.secondary_name))
                );
            }

            // Variables
            for (var variable_i in data.variables) {
                if (data.variables.hasOwnProperty(variable_i)) {
                    thead.append(
                        $($('<th></th>').text(data.variables[variable_i]))
                    );
                }
            }

            thead.append(
                $($('<th></th>').text('Platform')),
                $($('<th></th>').text('VOD'))
            );

            table.append(thead);

            var tbody = $('<tbody></tbody>');
            for(var r in data.runs){
                var run = data.runs[r];
                var row = $('<tr></tr>').addClass('run').append(
                    $('<td></td>').text(run.rank)
                );

                if (run['player-weblink'] !== '') {
                    row.append(
                        $('<td></td>').html(
                            $('<a></a>').addClass('player-weblink').attr(
                                {
                                    'href': run['player-weblink'],
                                    'target': '_blank'
                                }
                            ).text(run.name)
                        )
                    );
                } else {
                    row.append(
                        $('<td></td>').text(run.name)
                    );
                }

                row.append(
                    $('<td></td>').text(run.primary)
                );

                if (run.secondary !== undefined) {
                    row.append(
                        $('<td></td>').text(run.secondary)
                    );
                }

                for (var variable_i in data.variables) {
                    if (data.variables.hasOwnProperty(variable_i)) {
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
            table.append(tbody);

            div.empty();
            div.append(table);
        })
    }

    // On load
    var category_select = $('#category_select');
    var category_id = category_select.val();
    if (window.location.hash) {
        category_id = window.location.hash.replace('#', '');
    }
    buildLeaderboards(category_select.attr('data-game-id'), category_id);

    // On category select change
    category_select.on('change', function () {
        var game_id = $(this).attr('data-game-id');
        var category_id = this.value;
        buildLeaderboards(game_id, category_id);
    });

    $(document).on('click', 'div#leaderboards table tr', function(){
        var win = window.open($(this).attr('data-video'), '_blank');
    });

    $(document).on('click', '.player-weblink', function(e){
        e.stopPropagation();
    });


});
