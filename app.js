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

function getPoint(p) {
    return new paper.Point(p.x * r, p.y * r);
}

var tempPoint, tempPath;

var r = 15;

var racecarState = [
    { x: 10, y: 5, vx: 0, vy: 0 },
    { x: 12, y: 5, vx: 0, vy: 0 }
];

var racecarTraces = [
    [],
    []
]

var colors = ['blue', 'red']

var turn = 0;

var state = {
    turn: 0,
    racecars: [
        { p: { x: 10, y: 5 }, v: { x: 0, y: 0 }, },
        { p: { x: 12, y: 5 }, v: { x: 0, y: 0 }, },
    ]
};

function buildPage (canvasWidth, canvasHeight) {
    return {
        'grid': makeGrid(0, 0, canvasWidth, canvasHeight, r),
        'racecar': [
            
        ]
    }
}

window.onload = function () {
    var canvas = document.getElementById('Canvas');

    paper.setup(canvas);

    gridPaths = makeGrid(0, 0, canvas.width, canvas.height, r);
    gridPaths.forEach(p => 
        p.style = {
            strokeColor: '#ccc',
        }
    );

    racecarTraces.forEach((traces, i) => {
        startPoint = paper.Shape.Circle(
            getPoint(racecarState[i]), r / 5
        );
        startPoint.style = {
            fillColor: colors[i]
        };
        traces.push(startPoint);
    });

    tempPath = new paper.Path(
        getPoint(racecarState[turn]),
        getPoint(racecarState[turn])
    );
    tempPath.style = {
        strokeColor: '#aaf'
    };


    racecarTraces[turn].push(tempPoint);

    tempPoint = paper.Shape.Circle(
        getPoint(racecarState[turn]), 3
    );
    tempPoint.style = {
        fillColor: '#aaf'
    };

    racecarTraces[turn].push(tempPoint);

    paper.view.onMouseMove = function (e) {
        racecarState[turn] = {
            x: Math.round(e.point.x / r),
            y: Math.round(e.point.y / r)
        };
        var p = getPoint(racecarState[turn]);
        tempPoint.setPosition(p);
        tempPath.segments[1].setPoint(p);
        paper.view.draw();
    };

    paper.view.draw();
};