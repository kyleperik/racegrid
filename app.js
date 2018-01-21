function range(l) {
    return Array.from(new Array(l), (x, i) => i);
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
    }
};

var mutations = {
    setCanvasDimentions: (h, w) => {
        state.canvasHeight = h;
        state.canvasWidth = w;
        render('grid');
        render('tempStuff');
        render('racecarTraces');
    },
    setCanvasOffset: (x, y) => {
        state.canvasOffsetX = x;
        state.canvasOffsetY = y;
        render('grid');
        render('tempStuff');
        render('racecarTraces');
    },
    setResolution: r => {
        state.resolution = r;
        render('grid');
        render('tempStuff');
        render('racecarTraces');
    },
    setTurn: (v) => {
        state.turn = v;
        render('tempStuff');
    },
    setCursor: p => {
        state.cursor = p;
        render('tempStuff');
    },
    addTrace: (p, i) => {
        state.racecars[i].trace.push(p);
        render('tempStuff');
        render('racecarTraces');
    },
    setVelocity: (v, i) => {
        state.racecars[i].v = v;
    }
}

var renderings = {};

function render (thing) {
    var existingRenderings = renderings[thing];
    if (existingRenderings) {
        existingRenderings.forEach(r => r.remove());
    }

    renderings[thing] = renderFunctions[thing](state);

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
        var lines = points.map((r, j) => r.slice(0, -1).map((p, i) => {
            var l = new paper.Path(
                p,
                r[i + 1]
            );
            l.style = {
                strokeColor: s.racecars[j].color
            };
            return l;
        }));
        return [].concat.apply([], dots.concat(lines));
    },
    tempStuff: (s) => {
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
        tempPath.style = {
            strokeColor: '#aaf'
        };
        tempPoint = new paper.Shape.Circle(
            endPoint, s.resolution / 5
        );
        tempPoint.style = { fillColor: '#aaf' }
        return [tempPath, tempPoint];
    }
};

window.onload = function () {
    var canvas = document.getElementById('Canvas');

    paper.setup(canvas);

    mutations.setCanvasDimentions(
        canvas.height,
        canvas.width
    );

    render('grid');
    render('racecarTraces');
    render('tempStuff');

    window.onresize = () => mutations.setCanvasDimentions(
        canvas.height,
        canvas.width
    );

    canvas.onclick = function () {
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
        if (
            Math.abs(newV.x - r.v.x) > 1 ||
            Math.abs(newV.y - r.v.y) > 1
        ) { return; }
        mutations.setVelocity(newV, state.turn);
        mutations.addTrace(point, state.turn);
        mutations.setTurn((state.turn + 1) % state.racecars.length);
    };

    canvas.onmousewheel = function (e) {
        mutations.setResolution(state.resolution - e.deltaY / 50);

        //var o = state.resolution / 2;
        //mutations.setCanvasOffset(o, o);
    };

    paper.view.onMouseMove = function (e) {
        mutations.setCursor(e.point);
    };

    paper.view.draw();
};