(function() {
    var websheet = window.websheet()
        .column( "name" )
        .column( "B" )
        .column( "C" )
        .column( "D" )
        .column( "E" )
        .column( "F" )
        .column( "G" )
        .column( "H" )
        .column( "I" )

    d3.select( "#sheet" )
        .datum([
            { "name": "Alice", "B": 100 },
            { "name": "Bob", "B": 200 },
            { "name": "Alice", "B": 100 },
            { "name": "Bob", "B": 200 },
            { "name": "Alice", "B": 100 },
            { "name": "Bob", "B": 200 },
            { "name": "Alice", "B": 100 },
            { "name": "Bob", "B": 200 },
            { "name": "Alice", "B": 100 },
            { "name": "Bob", "B": 200 },
            { "name": "Alice", "B": 100 },
            { "name": "Bob", "B": 200 },
            { "name": "Alice", "B": 100 },
            { "name": "Bob", "B": 200 },
            { "name": "Alice", "B": 100 },
            { "name": "Bob", "B": 200 },
            { "name": "Alice", "B": 100 },
            { "name": "Bob", "B": 200 },
            { "name": "Alice", "B": 100 },
            { "name": "Bob", "B": 200 },
            { "name": "Alice", "B": 100 },
            { "name": "Bob", "B": 200 },
            { "name": "Alice", "B": 100 },
            { "name": "Bob", "B": 200 },
            { "name": "Alice", "B": 100 },
            { "name": "Bob", "B": 200 },
            { "name": "Alice", "B": 100 },
            { "name": "Bob", "B": 200 },
            { "name": "Alice", "B": 100 },
            { "name": "Bob", "B": 200 },
            { "name": "Alice", "B": 100 },
            { "name": "Bob", "B": 200 },
            { "name": "Alice", "B": 100 },
            { "name": "Bob", "B": 200 },
            { "name": "Alice", "B": 100 },
            { "name": "Bob", "B": 200 },
            { "name": "Alice", "B": 100 },
            { "name": "Bob", "B": 200 },
            { "name": "Alice", "B": 100 },
            { "name": "Bob", "B": 200 },
            { "name": "Alice", "B": 100 },
            { "name": "Bob", "B": 200 },
            { "name": "Alice", "B": 100 },
            { "name": "Bob", "B": 200 },
            { "name": "Alice", "B": 100 },
            { "name": "Bob", "B": 200 },
            { "name": "Alice", "B": 100 },
            { "name": "Bob", "B": 200 },
        ])
        .call( websheet )


    window.__debug = websheet;
})();
