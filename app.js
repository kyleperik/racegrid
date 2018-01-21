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

var tempPoint, tempPath;

var racecarState = [
    { x: 10, y: 5, vx: 0, vy: 0 },
    { x: 12, y: 5, vx: 0, vy: 0 }
];

var racecarTraces = [
    [],
    []
]

var state = {
    turn: 0,
    canvasHeight: 0,
    canvasWidth: 0,
    canvasOffsetX: 0,
    canvasOffsetY: 0,
    resolution: 15,
    racecars: [
        { p: { x: 10, y: 5 }, v: { x: 0, y: 0 }, color: 'blue', },
        { p: { x: 12, y: 5 }, v: { x: 0, y: 0 }, color: 'red', },
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
        render.tempStuff(state);
    },
    setCursor: p => {
        state.cursor = p;
        render('tempStuff');
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
            s.resolution - s.canvasOffsetX % s.resolution,
            s.resolution - s.canvasOffsetY % s.resolution,
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
        var points = s.racecars.map((racecar, i) => {
            p = paper.Shape.Circle(
                expandPoint(racecar.p, s.resolution),
                s.resolution / 5
            );
            p.style = {
                fillColor: racecar.color
            };
            return p;
        });
        return points;
    },
    tempStuff: (s) => {
        var endPoint = expandPoint(
            roundPoint(s.cursor, s.resolution),
            s.resolution
        );
        tempPath = new paper.Path(
            expandPoint(s.racecars[s.turn].p, s.resolution),
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

    canvas.onmousewheel = function (e) {
        console.log('s')

        mutations.setResolution(state.resolution - e.deltaY / 50);

        var o = (state.resolution - e.deltaY / 50) / 2;

        mutations.setCanvasOffset(o, o);
    };

    paper.view.onMouseMove = function (e) {
        mutations.setCursor(e.point);
        /*racecarState[turn] = {
            x: Math.round(e.point.x / r),
            y: Math.round(e.point.y / r)
        };
        var p = expandPoint(racecarState[turn]);
        tempPoint.setPosition(p);
        tempPath.segments[1].setPoint(p);
        paper.view.draw();*/
    };

    paper.view.draw();
};