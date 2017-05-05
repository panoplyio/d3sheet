(function() {
/**
 *
 *
 */
class Websheet extends HTMLElement {

    render() {
        $create(`
            <style>${Websheet.style}</style>
            <table>
                <thead>
                    <tr></tr>
                </thead>
                <tbody></tbody>
            </table>
        `).appendTo(this)

        // determine the column names for all of the rows
        var data = this._data
        var cols = new Set()
        for (var row of data) {
            Object.keys(row).forEach((k) => cols.add(k))
        }

        cols = [{ w: 40 }] // first: row-line column
            .concat(Array.from(cols).map((k) => ({k: k})))
            .concat({}) // last: span column to fill width

        // columns
        var headers = Array.from(cols).map(function (col) {
            var style = col.w ? `style="width: ${col.w}px"` : ''
            return `<th ${style}>${col.k || ''}</th>`
        }).join('')

        headers = $create(headers)
        this.querySelector('thead > tr')
            .appendChild(headers)

        // rows
        data = [].concat(data) // copy the data
            .concat({}) // add one extra row as filler

        for (var row of data) {
            var cells = cols.map((col) => `<td>${row[col.k] || ''}</td>`)
            var row = $create(`<tr>${cells.join('')}</tr>`)
            this.querySelector('tbody')
                .appendChild(row)
        }

    }

    set data(v) {
        this._data = v
        window.requestAnimationFrame(this.render.bind(this))
    }

    get data() {
        return this._data
    }

    static get style() {
        return STYLE
    }

    // upgrade a
    static init(el) {
        return upgrade(el)
    }
}

function $create(html) {
    var tpl = document.createElement('template')
    tpl.innerHTML = html
    var doc = document.importNode(tpl.content, true)

    doc.appendTo = function(parent) {
        parent.appendChild(doc)
    }
    return doc
}

function $merge(src, dst) {
    var i = 0;
    while (src.childNodes.length > 0) {
        var srcEl = src.childNodes[0]
        var dstEl = dst.childNodes[i]

        // apply attributes


    }
}

function upgrade(el) {
    if (el instanceof Websheet) {
        return el // idempotent
    }

    Object.setPrototypeOf(el, window.Websheet.prototype)
    return el
}

// register the element
if ('customElements' in window) {
    window.customElements.define('web-sheet', Websheet)
} else if ('registerElement' in document) {
    Websheet = document.registerElement('web-sheet', Websheet)
    window.Websheet = Websheet
} else {
    console.warn('<web-sheet>: custom elements aren\'t supported')
    console.warn('<web-sheet>: Use Websheet.init(el) explicitly')
}

window.Websheet = Websheet

const STYLE = `
web-sheet {
    overflow: auto;
    display: block;
}

web-sheet table {
    position: relative;
    left: 0px;
    table-layout: fixed;
    border-spacing: 0;
    padding: 0;
    width: 100%;
    height: 100%
}

web-sheet tr {
    height: 10px;
}

web-sheet tr:last-child {
    height: auto;
}


web-sheet th,
web-sheet td {
    background: white;
    border: 0px solid #dadada;
    border-right-width: 1px;
    border-bottom-width: 1px;
    font: normal 13px arial, sans-serif;
    padding: 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

web-sheet th,
web-sheet td:first-child {
    background: #f3f3f3;
    border-color: #cccccc;
    text-align: center;
}

web-sheet th {
    position: relative;
    width: 200px;
}

web-sheet th:last-child {
    width: auto;
}

web-sheet th:after {
    content: "";
    display: block;
    position: absolute;
    opacity: 0;
    top: 0;
    right: -3px;
    bottom: 0;
    width: 6px;
    cursor: ew-resize;
    z-index: 1000;
    background: #4d90fe;
    transition: opacity .15s;
}

web-sheet th.resizable:after {
    opacity: 1;
}

web-sheet td.selected {
    background: #ecf3ff;
}

web-sheet th.selected,
web-sheet td.selected:first-child {
    background: #dddddd;
}
`
})()
