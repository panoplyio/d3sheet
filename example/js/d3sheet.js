(function () {
    var SCROLL_SENSITIVITY = 15;

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
            columns.push({ 
                name: name, 
                accessor: accessor, 
                w: 200
            });
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

        var selection = { start: null, end: null }
        var selectAnimFrame;
        d3sheet.selection = function () {
            return {
                start: function ( xy ) {
                    if ( !arguments.length ) {
                        return selection.start;
                    }
                    selection.start = xy;
                    selection.end = xy;

                    cancelAnimationFrame( selectAnimFrame );
                    selectAnimFrame = requestAnimationFrame( function () {
                        drawSelection( el, selection.start, selection.end );
                    })

                    return this;
                },
                end: function ( xy ) {
                    if ( !arguments.length ) {
                        return selection.end;
                    }

                    selection.end = xy;
                    // debug( "Selection", "End:", xy );

                    cancelAnimationFrame( selectAnimFrame );
                    selectAnimFrame = requestAnimationFrame( function () {
                        drawSelection( el, selection.start, selection.end );
                    });

                    return this;
                },
            }
        }

        var scroll = [ 1, 1 ];
        var scrollAnimFrame;
        d3sheet.scroll = function ( xy ) {
            if ( arguments.length == 0 ) {
                return [ scroll[ 0 ], scroll[ 1 ] ]; // copy
            }

            var x = Math.min( this.columns().length - 1, Math.max( 1, xy[ 0 ] ) );
            var y = Math.max( 1, xy[ 1 ] );

            window.cancelAnimationFrame( scrollAnimFrame );

            if ( x == scroll[ 0 ] && y == scroll[ 1 ] ) {
                return this;
            }

            // changing the dom will only take place on the next animation
            // frame in order to throttle the ui repaints while the user scrolls
            scrollAnimFrame = requestAnimationFrame( function () {
                scroll = [ x, y ];
                scrollTo( el, x, y );
            });

            return this;
        }

        return d3sheet
    }

    function draw( that, el, data ) {
        if ( !el.__d3sheet ) {
            el.addEventListener( "mousewheel", onMouseWheel() )

            // el.addEventListener( "mousedown", resizeMouseDown() )
            // el.addEventListener( "mouseup", resizeMouseUp() )
            el.addEventListener( "mousemove", resizeMouseMove() )

            el.addEventListener( "mousedown", selectMouseDown() )
            el.addEventListener( "mouseup", selectMouseUp() )
            el.addEventListener( "mousemove", selectMouseMove() )

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

        columns.forEach( function ( col, i ) {
            col.rown = 0;
            col.coln = i;
        })

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
            .style( "position", "relative" )
            .html( "<span></span>" )
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
                return columns.map( function ( col, j ) {
                    return {
                        rown: i + 1,
                        coln: j,
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

    function selectMouseDown () {
        return function ( ev ) {
            if ( this.__resizing ) {
                return;
            }
            this.__selecting = true;
            ev.preventDefault();
            var datum = d3.select( ev.target ).datum();

            this.__d3sheet.selection()
                .start([ datum.coln || 0, datum.rown || 0 ])
        }
    }

    function selectMouseUp () {
        return function ( ev ) {
            this.__selecting = false;
            // ev.preventDefault();
            var datum = d3.select( ev.target ).datum();
            this.__d3sheet.selection()
                .end([ datum.coln || Infinity, datum.rown || Infinity ]);
        }
    }

    function selectMouseMove () {
        return function ( ev ) {
            if ( !this.__selecting ) {
                return
            }
            // ev.preventDefault();
            var datum = d3.select( ev.target ).datum();
            this.__d3sheet.selection()
                .end([ datum.coln || Infinity, datum.rown || Infinity ]);
        }
    }

    function resizeMouseDown() {
        return function ( ev ) {
            if ( this.__selecting ) {
                return;
            }

            if ( ev.target.tagName != "TH" ) {
                return;
            }

            ev.preventDefault()
            this.__resizing = { 
                x: ev.clientX,
                w: parseInt( ev.target.style.width ),
                el: ev.target
            };
        }
    }

    function resizeMouseUp () {
        return function ( ev ) {
            this.__resizing = null;
        }
    }

    function resizeMouseMove() {
        return function ( ev ) {
            if ( ev.target.tagName != "TH" ) {
                return;
            }

            if ( this.__selecting ) {
                return;
            }

            var rect = ev.target.getBoundingClientRect();
            var x = ev.clientX - rect.left;

            // ev.target.classList.toggle( "resizable", x > 190 );

            // if ( this.__resizing ) {
            //     var x = ev.clientX - this.__resizing.x;
            //     this.__resizing.el.style.width = ( this.__resizing.w + x ) + "px";
            //     return
            // }

            // var rect = ev.target.getBoundingClientRect();
            // var x = ev.clientX - rect.left;
            // ev.target.classList.toggle( "resizable", x > 190 );
        }
    }

    function onMouseWheel () {
        var deltaX = 0, deltaY = 0;
        return function ( ev ) {
            ev.preventDefault();
            ev.stopPropagation();

            deltaX += ev.deltaX;
            deltaY += ev.deltaY;

            // debug( "MouseWheel", "X:", deltaX, "Y:", deltaY );
            var scroll = this.__d3sheet.scroll();
            if ( deltaX > SCROLL_SENSITIVITY ) {
                scroll[ 0 ] += 1;
                deltaX = 0;
            } else if ( deltaX < -SCROLL_SENSITIVITY ) {
                scroll[ 0 ] -= 1;
                deltaX = 0;
            }

            if ( deltaY > SCROLL_SENSITIVITY ) {
                scroll[ 1 ] += 1;
                deltaY = 0;
            } else if ( deltaY < -SCROLL_SENSITIVITY ) {
                scroll[ 1 ] -= 1;
                deltaY = 0;
            }

            this.__d3sheet.scroll( scroll );
        }
    }

    function drawSelection( el, start, end ) {
        el = d3.select( el );

        // remove previous selection
        el.selectAll( ".selected" )
            .classed( "selected", false );

        // empty selection or deselect
        if ( !start || !end ) {
            return;
        }

        var startx = start[ 0 ];
        var endx = end[ 0 ];
        var starty = start[ 1 ];
        var endy = end[ 1 ];

        // reversed order
        if ( startx > endx ) {
            endx = startx;
            startx = end[ 0 ];
        }
        if ( starty > endy ) {
            endy = starty;
            starty = end[ 1 ];
        }

        // find the relevant rows in the range of starty-endy
        var selector = [
            "tbody > tr",
            ":nth-child(n+" + ( starty ) + ")",
            endy == Infinity ? "" : ":nth-child(-n+" + ( endy ) + ")"
        ].join( "" );
        var rows = el.selectAll( selector );
        
        // find the relevant columns within these rows in the range
        // of startx-endx
        var selector = [
            "*",
            ":nth-child(n+" + ( startx + 1 ) + ")",
            endx == Infinity ? "" : ":nth-child(-n+" + ( endx + 1 ) + ")"
        ].join( "" );
        var cells = rows.selectAll( selector );
        
        // add the relevant headers to the selection
        var headers = el.select( "thead > tr" )
            .selectAll( selector );

        // add the relevant row-numbers to the selection
        var rownums = rows.selectAll( "td:first-child" );

        // finally, apply the selected class
        cells.classed( "selected", true );
        headers.classed( "selected", true );
        rownums.classed( "selected", true );
    }

    function scrollTo( el, x, y ) {

        // x-y starts with 1, offset back to 0
        x -= 1;
        y -= 1;

        var headers = el.querySelectorAll( "th" );
        var column = headers[ x + 1 ].getBoundingClientRect();
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

        // find the relevant row element
        var row = el.querySelector( "tbody > tr:nth-child(" + ( y + 1 ) + ")" );
        var rect = row.getBoundingClientRect();
        var top = el.scrollTop
            + rect.top 
            - container.top
            - column.height;

        [].forEach.call( headers, function ( row ) {
            row.style.position = "relative";
            row.style.top = ( +row.style.top || 0 ) + top + "px";
        })

        el.scrollTop = top;
    }

    // debug
    window.d3sheet.debug = true;
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

