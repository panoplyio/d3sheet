(function() {
    var d3sheet = window.d3sheet()
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
        .call( d3sheet )


    window.__debug = d3sheet;
})();
