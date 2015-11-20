(function () {
    window.d3sheet = function () {
        var columns = [];


        function d3sheet( selection ) { 
            return d3sheet.draw( selection ) 
        }

        d3sheet.columns = function ( _columns ) { 
            if ( arguments.length == 0 ) {
                return columns 
            }
            columns = _columns;
            return this;
        }

        d3sheet.column = function ( name, accessor ) {
            if ( !accessor ) {
                accessor = function ( d ) {
                    return d[ name ]
                }
            }
            columns.push({ name: name, accessor: accessor, w: 200 });
            return this;
        }

        var el;
        d3sheet.draw = function ( selection ) {
            if ( selection instanceof Element ) {
                selection = d3.selectAll( [ selection ] );
            }

            selection.each( function ( data ) { 
                el = this;
                draw( d3sheet, this, data ); 
            })
            return this;
        }

        var scroll = [ 0, 0 ];
        var scrollAnimFrame;
        d3sheet.scroll = function ( xy ) {
            if ( arguments.length == 0 ) {
                return [ scroll[ 0 ], scroll[ 1 ] ]; // copy
            }

            var col = Math.min( this.columns().length - 1, Math.max( 0, xy[ 0 ] ) );
            var row = xy[ 1 ];

            // changing the dom will only take place on the next animation
            // frame in order to throttle the ui repaints while the user scrolls
            window.cancelAnimationFrame( scrollAnimFrame );
            scrollAnimFrame = requestAnimationFrame( function () {
                scroll = [ col, row ];

                // find the relevant header column element
                var headers = el.querySelectorAll( "th" );
                var column = headers[ col + 1 ].getBoundingClientRect();
                var container = el.getBoundingClientRect();
                var rowsn = headers[ 0 ].getBoundingClientRect();
                var left = el.scrollLeft 
                    + column.left 
                    - container.left 
                    - rowsn.width;

                var rows = el.querySelectorAll( "th:first-child,td:first-child" );
                [].forEach.call( rows, function ( row ) {
                    row.style.position = "relative";
                    row.style.left = ( +row.style.left || 0 ) + left + "px";
                })

                el.scrollLeft = left;
            })
        }

        return d3sheet
    }

    function draw( that, el, data ) {
        if ( !el.__d3sheet ) {
            el.addEventListener( "mousewheel", onMouseWheel() )

            // el.addEventListener( "scroll", function ( ev ) {
                // console.log( "SCROLL" )
                // scroll by dragging the scroll bar,
                // TODO: check the change in scrollLeft to apply
                // our own snap-scroll
                // this.scrollLeft = 0;
            // })
        }
        el.__d3sheet = that;

        el = d3.select( el )
            .classed( "d3sheet", true );
        

        var columns = [].concat( that.columns() )
        columns.unshift({
            accessor: function ( d, i ) {
                return i + 1;
            },
            w: 40
        })
        columns.push({
            accessor: function () {},
            w: 2000
        });

        var colwidths = columns.map( function ( d ) {
            return d.w || 0;
        });

        var table = el.selectAll( "table" )
            .data( [ data ] );
        table.enter().append( "table" )
            .style( "position", "relative" )
            .style( "left", "0px" )
            .html( "<thead><tr></tr></thead><tbody></tbody>" )

        // headers
        var rows = table.select( "thead > tr" )
        var headers = rows.selectAll( "th" )
            .data( columns )
        headers.enter().append( "th" )
        headers
            .text( function ( d ) {
                return d.name || ""
            })
            .style( "width", function ( d ) {
                return d.w + "px"
            })

        // rows
        var tbody = table.select( "tbody" );
        var rows = tbody.selectAll( "tr" )
            .data( data );
        rows.enter().append( "tr" );
        var cells = rows.selectAll( "td" )
            .data( function ( d, i ) {
                return columns.map( function ( col ) {
                    return {
                        v: col.accessor( d, i ),
                    }
                })
            })
        cells.enter().append( "td" );
        cells
            .text( function ( d ) {
                return d.v
            })
    }

    function onMouseWheel () {
        var deltaX = 0;
        return function ( ev ) {
            ev.preventDefault();
            ev.stopPropagation();
            deltaX += ev.deltaX;

            debug( "MouseWheel X:", deltaX );
            if ( deltaX > 15 ) {
                var scroll = this.__d3sheet.scroll();
                this.__d3sheet.scroll( [ ++scroll[ 0 ], scroll[ 1 ] ] );
                deltaX = 0;
            } else if ( deltaX < -15 ) {
                var scroll = this.__d3sheet.scroll();
                this.__d3sheet.scroll( [ --scroll[ 0 ], scroll[ 1 ] ] );
                deltaX = 0;
            }
        }
    }

    window.d3sheet.debug = false;
    function debug() {
        if ( window.d3sheet.debug ) {
            console.log.apply( console, arguments );
        }
    }

    var requestAnimationFrame = window.requestAnimationFrame;
    var cancelAnimationFrame = window.cancelAnimationFrame;
})();


// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
// MIT license
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

