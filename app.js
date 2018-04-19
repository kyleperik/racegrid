function range(l) {
    return Array.from(new Array(l), (x, i) => i);
}

Array.prototype.flatten = function (f) {
    f = f || ((x) => x);
    return [].concat.apply([], f(this));
}

function makeGrid(x, y, lx, ly, r) {
    p = [
        {s: x, e: lx},
        {s: y, e: ly}
    ].map(d => 
        range(Math.floor((d.e - d.s) / r + 1)).map(i => 
            r * i + d.s
        )
    );
    return p[0].map(point => paper.Path.Line(
        new paper.Point(point, y),
        new paper.Point(point, ly)
    )).concat(
        p[1].map(point => paper.Path.Line(
            new paper.Point(x, point),
            new paper.Point(lx, point)
        ))
    );
}

function expandPoint(p, r) {
    return new paper.Point(p.x * r, p.y * r);
}

function roundPoint(p, r) {
    return {
        x: Math.round(p.x / r),
        y: Math.round(p.y / r),
    }
}

var state = {
    turn: 0,
    boundryMode: true,
    boundry: [],
    canvasHeight: 0,
    canvasWidth: 0,
    canvasOffsetX: 0,
    canvasOffsetY: 0,
    resolution: 15,
    racecars: [
        {
            v: { x: 0, y: 0 },
            trace: [
                { x: 10, y: 5 }
            ],
            color: 'blue',
        },
        {
            v: { x: 0, y: 0 },
            trace: [
                { x: 12, y: 5 }
            ],
            color: 'red',
        },
    ],
    cursor: {
        x: 10,
        y: 30
    },
    mousedown: false,
    boundryHelp: [
        { letter: 'd' },
    ]
};

var mutations = {
    setCanvasDimentions: (h, w) => {
        state.canvasHeight = h;
        state.canvasWidth = w;
        render('all');
    },
    setCanvasOffset: (x, y) => {
        state.canvasOffsetX = x;
        state.canvasOffsetY = y;
        render('all');
    },
    setResolution: r => {
        state.resolution = r;
        render('all');
    },
    setTurn: (v) => {
        state.turn = v;
        render('tempStuff');
        render('velocityBox');
    },
    setCursor: p => {
        state.cursor = p;
        render('tempStuff');
    },
    setMousedown: v => {
        state.mousedown = v;
    },
    addTrace: (p, i) => {
        state.racecars[i].trace.push(p);
        render('tempStuff', 'racecarTraces');
    },
    setVelocity: (v, i) => {
        state.racecars[i].v = v;
        render('velocityBox');
    },
    setBoundryMode: v => {
        state.boundryMode = v;
        render('velocityBox', 'tempStuff', 'boundry', 'help');
    },
    addBoundryPoint: p => {
        state.boundry.push(p);
        render('boundry');
    },
}

function move (state, direction) {
    var r = state.racecars[state.turn];
    var newV = {
        x: r.v.x + direction.x,
        y: r.v.y + direction.y
    };
    var lastPoint = r.trace[r.trace.length - 1];
    var point = {
        x: lastPoint.x + newV.x,
        y: lastPoint.y + newV.y
    };
    var newV = {
        x: r.v.x + direction.x,
        y: r.v.y + direction.y
    };
    if (
        Math.abs(direction.x) > 1 ||
        Math.abs(direction.y) > 1
    ) { return; }
    var isInBounds = renderings['boundry'][0].contains(
        expandPoint(point, state.resolution)
    );
    console.log(isInBounds);
    if (isInBounds) {
        mutations.setVelocity(newV, state.turn);
    } else {
        mutations.setVelocity({
            x: 0,
            y: 0
        } , state.turn);
    }
    mutations.addTrace(point, state.turn);
    mutations.setTurn((state.turn + 1) % state.racecars.length);
} 

var renderings = {};

var renderShortcuts = {
    'all': [
        'grid',
        'racecarTraces',
        'tempStuff',
        'velocityBox',
        'boundry',
        'help',
    ]
}

function render () {
    var args = Array.from(arguments);
    var things = args.filter(
        t => !renderShortcuts[t]
    );

    var shortcut = args.map(
        t => renderShortcuts[t]
    ).filter(s => s).flatten();

    var allThings = things.concat(shortcut);
    allThings.forEach(thing => {
        var existingRenderings = renderings[thing];
        if (existingRenderings) {
            existingRenderings.forEach(r => {
                if (!r.remove) {
                    throw new Error(r + ' can not be removed for ' + thing);
                }
                r.remove()
            });
        }

        renderings[thing] = renderFunctions[thing](state);
    });
    paper.view.draw();
}

var renderFunctions = {
    grid: (s) => {
        var paths = makeGrid(
            s.canvasOffsetX % s.resolution - s.resolution,
            s.canvasOffsetY % s.resolution - s.resolution,
            s.canvasWidth, s.canvasHeight,
            s.resolution
        );
        paths.forEach(p => 
            p.style = {
                strokeColor: '#ccc',
            }
        );
        return paths;
    },
    racecarTraces: (s) => {
        var points = s.racecars.map(
            racecar => racecar.trace.map(
                p => expandPoint(p, s.resolution)
            )
        );
        var dots = points.map((r, i) => r.map(p => {
            var d = paper.Shape.Circle(p, s.resolution / 5);
            d.style = {
                fillColor: s.racecars[i].color
            };
            return d;
        }));
        var lines = points.map((r, j) => {
            var l = new paper.Path(r);
            l.style = {
                strokeColor: s.racecars[j].color
            };
            return l;
        });
        return [].concat.apply([], dots.concat([lines]));
    },
    tempStuff: (s) => {
        if (s.boundryMode) return [];
        var endPoint = expandPoint(
            roundPoint(s.cursor, s.resolution),
            s.resolution
        );
        tempPath = new paper.Path(
            expandPoint(
                s.racecars[s.turn].trace[
                    s.racecars[s.turn].trace.length - 1
                ],
                s.resolution
            ),
            endPoint
        );
        tempPath.style = { strokeColor: s.racecars[s.turn].color };
        tempPath.opacity = 0.5;
        tempPoint = new paper.Shape.Circle(
            endPoint, s.resolution / 5
        );
        tempPoint.style = { fillColor: s.racecars[s.turn].color };
        tempPoint.opacity = 0.5;
        return [tempPath, tempPoint];
    },
    velocityBox: (s) => {
        if (s.boundryMode) return [];
        var r = s.racecars[s.turn];
        var pos = r.trace[r.trace.length - 1];
        var aboutNewPos = {
            x: pos.x + r.v.x,
            y: pos.y + r.v.y,
        }
        var corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]]
        var path = new paper.Path(corners.map(x =>
            expandPoint({
                x: aboutNewPos.x + x[0],
                y: aboutNewPos.y + x[1]
            }, s.resolution)
        ));
        path.closed = true;
        path.style = { strokeColor: 'purple' };
        return [path];
    },
    boundry: function (s) {
        var path = new paper.Path(s.boundry.map(
            p => new paper.Point(p.x, p.y)
        ));
        path.style = {
            strokeColor: '#333'
        };
        path.closed = !s.boundryMode;
        return [path];
    },
    help: function (s) {
        if (!s.boundryMode) return [];
        return s.boundryHelp.map((h, i) => {
            var padding = 5;
            var size = new paper.Size(
                30, 30
            )
            var pos = {
                x: s.canvasWidth - (
                    size.width + padding +
                    i * (size.width + padding * 2)
                ),
                y: s.canvasHeight - (
                    size.height + padding
                )
            }
            var box = new paper.Path.Rectangle(
                new paper.Point(
                    pos.x,
                    pos.y
                ),
                size
            );
            box.style = {
                strokeColor: '#555',
                fillColor: 'white',
            };
            box.opacity = 0.5;
            var letter = new paper.PointText(
                new paper.Point(
                    pos.x + 12, pos.y + 18
                )
            );
            letter.content = h.letter;
            return [box, letter];
        }).flatten();
    }
};

window.onload = function () {
    var canvas = document.getElementById('Canvas');

    paper.setup(canvas);

    mutations.setCanvasDimentions(
        canvas.clientHeight,
        canvas.clientWidth
    );

    render('all');

    window.onresize = () => mutations.setCanvasDimentions(
        canvas.clientHeight,
        canvas.clientWidth
    );

    canvas.onclick = function () {
        if (!state.boundryMode) {
            var r = state.racecars[state.turn];
            var point = roundPoint(
                state.cursor,
                state.resolution
            );
            var lastPoint = r.trace[r.trace.length - 1];
            var newV = {
                x: point.x - lastPoint.x,
                y: point.y - lastPoint.y
            };
            move(state, {
                x: (point.x - lastPoint.x) - r.v.x,
                y: (point.y - lastPoint.y) - r.v.y
            })
        }
    };

    canvas.onmousewheel = function (e) {
        mutations.setResolution(state.resolution - e.deltaY / 50);

        //var o = state.resolution / 2;
        //mutations.setCanvasOffset(o, o);
    };

    paper.view.onMouseMove = function (e) {
        mutations.setCursor(e.point);
        if (state.mousedown && state.boundryMode) {
            mutations.addBoundryPoint(e.point);
        }
    };
    paper.view.onMouseDown = function (e) {
        mutations.setMousedown(true);
        if (state.boundryMode) {
            mutations.addBoundryPoint(state.cursor);
        }
    };
    paper.view.onMouseUp = function (e) {
        mutations.setMousedown(false);
    };

    paper.view.onKeyDown = function (e) {
        if (state.boundryMode) {
            if (e.key === 'd') {
                mutations.setBoundryMode(false);
            }
        }
        else {
            var left = ['h', 'y', 'b'].indexOf(e.key) != -1;
            var right = ['l', 'u', 'n'].indexOf(e.key) != -1;
            var up = ['k', 'y', 'u'].indexOf(e.key) != -1;
            var down = ['j', 'b', 'n'].indexOf(e.key) != -1;
            var nx = (left ? -1 : 0) + (right ? 1 : 0);
            var ny = (up ? -1 : 0) + (down ? 1 : 0);
            move(state, { x: nx, y: ny });
        }
    }

    paper.view.draw();
};