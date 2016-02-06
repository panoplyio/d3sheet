(function () {
    var SCROLL_SENSITIVITY = 15;
    var RESIZE_SENSITIVITY = 20;

    window.websheet = function () {
        var columns = [];

        function websheet( selection ) { 
            return websheet.draw( selection ) 
        }

        websheet.columns = function ( _columns ) { 
            if ( arguments.length == 0 ) {
                return columns 
            }
            columns = _columns;
            return this;
        }

        websheet.column = function ( name, accessor ) {
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
        websheet.draw = function ( selection ) {
            if ( selection instanceof Element ) {
                selection = d3.selectAll( [ selection ] );
            }

            selection.each( function ( data ) { 
                el = this;
                draw( websheet, this, data );
                var max = getBounderies( websheet, this );
                websheet.__maxx = max.x;
                websheet.__maxy = max.y;
            })
            return this;
        }

        function getBounderies( that, el ) {
            var rect = el.getBoundingClientRect();
            var rows = d3.select( el )
                .selectAll( 'tbody > tr' )[ 0 ];

            var height = Math.floor( rect.height );
            var maxy;
            for ( maxy = rows.length ; maxy > 0 ; maxy -= 1 ) {
                height -= rows[ maxy - 1 ].getBoundingClientRect().height;
                if ( height <= 0 ) {
                    break
                }
            }

            maxy += 1; // extra room for 1 header row

            return { x: that.columns().length - 1, y: maxy }
        }

        var selection = { start: null, end: null }
        var selectAnimFrame;
        websheet.selection = function () {
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
        websheet.scroll = function ( xy ) {
            var rows = d3.select( el ).datum();
            if ( arguments.length == 0 ) {
                return [ scroll[ 0 ], scroll[ 1 ] ]; // copy
            }

            var x = Math.min( this.__maxx, Math.max( 1, xy[ 0 ] ) );
            var y = Math.min( this.__maxy, Math.max( 1, xy[ 1 ] ) );

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

        return websheet
    }

    function draw( that, el, data ) {
        el = d3.select( el )
            .classed( "websheet", true );

        if ( !el.node().__websheet ) {
            el.on( "mousewheel", onMouseWheel() );

            // el.on( "mousedown", onMouseDown() );
            // el.on( "mouseup", onMouseUp() );
            // el.on( "mousemove", onMouseMove() );

            init( el.node() );
        }

        el.node().__websheet = that;

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
            .style( "position", "relative" );
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
        rows.exit().remove();
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
            });
    }

    function init( el ) {
        var options = { el: el };

        // resize
        el.addEventListener( "mousemove", function ( ev ) {
            ev.preventDefault()
            resizeMove( options, ev )
        });
        el.addEventListener( "mousedown", function ( ev ) {
            resizeDown( options, ev )
        });
        el.addEventListener( "mouseup", function ( ev ) {
            resizeUp( options, ev )
        });

        // select
        el.addEventListener( "mousemove", function ( ev ) {
            selectMove( options, ev );
        })
        el.addEventListener( "mousedown", function ( ev ) {
            selectDown( options, ev );
        })
        el.addEventListener( "mouseup", function ( ev ) {
            selectUp( options, ev );
        })
    }

    function resizeMove( options, ev ) {
        if ( options.resizing ) {
            var dx = ev.clientX - options.resizing.x;
            var w = options.resizing.w + dx;
            options.resizable.style.width = Math.max( w, 14 ) + "px";
            return;
        }


        var th = parentSelector( ev.target, ".websheet th" );
        var resizable;
        if ( th ) {
            var rect = th.getBoundingClientRect();
            var left = ev.clientX - rect.left;
            var right = rect.width - left;

            if ( right < RESIZE_SENSITIVITY ) {
                resizable = th;
            }
        }

        if ( options.resizable && options.resizable != resizable ) {
            options.resizable.classList.remove( "resizable" );
            options.resizable = null;
        }

        if ( resizable ) {
            resizable.classList.add( "resizable" );
            options.resizable = resizable;
        }
    }

    function resizeDown ( options, ev ) {
        if ( !options.resizable ) {
            return;
        }

        options.resizing = {
            w: parseInt( options.resizable.style.width ),
            x: ev.clientX
        }
    }

    function resizeUp ( options ) {
        if ( options.resizing ) {
            var col = d3.select( options.resizable ).datum();
            col.w = parseInt( options.resizable.style.width );
        }
        options.resizing = null;
    }

    function selectDown ( options, ev ) {
        if ( options.resizing ) {
            return 
        }
        options.__selecting = true;
        ev.preventDefault();
        var datum = d3.select( ev.target ).datum();
        options.el.__websheet.selection()
            .start([ datum.coln || 0, datum.rown || 0 ])
    }

    function selectMove ( options, ev ) {
        if ( options.__selecting ) {
            var datum = d3.select( ev.target ).datum();
            options.el.__websheet.selection()
                .end([ datum.coln || Infinity, datum.rown || Infinity ]);
        }
    }

    function selectUp ( options, ev ) {
        if ( options.__selecting ) {
            var datum = d3.select( ev.target ).datum();
            options.el.__websheet.selection()
                .end([ datum.coln || Infinity, datum.rown || Infinity ]);
        }
        options.__selecting = false;
    }

    function onMouseWheel () {
        var deltaX = 0, deltaY = 0;
        return function ( ev ) {
            var ev = d3.event;
            ev.preventDefault();
            ev.stopPropagation();

            deltaX += ev.deltaX;
            deltaY += ev.deltaY;

            // debug( "MouseWheel", "X:", deltaX, "Y:", deltaY );
            var scroll = this.__websheet.scroll();
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

            this.__websheet.scroll( scroll );
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
    window.websheet.debug = true;
    function debug() {
        if ( window.websheet.debug ) {
            console.log.apply( console, arguments );
        }
    }

    function parentSelector( el, selector ) {
        while ( el && el.matches ) {
            if ( el.matches( selector ) ) {
                return el;
            }
            el = el.parentNode;
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

