$(document).ready(function () {
    buildFrontPage();
});

function buildFrontPage() {
    var records_div = $('#records');
    getWorldRecords('Dark_Souls', function (a) {
        console.log(a);
        var table = $('<table></table>');
        for (var c in a) {
            var category = a[c];
            table.append(
                $('<tr></tr>').append(
                    $('<td></td>').text(category.category.name),
                    $('<td></td>').text(category.players[0].name),
                    $('<td></td>').text(category.runs_d.primary)
                )
            )
        }
        records_div.html(table);
    })
}

function getWorldRecords(game, callback) {
    $.getJSON('/api/wr/game/' + game, function (a, b) {
        callback(a);
    })
}