const symbols = [d3.symbolCircle, d3.symbolCross, d3.symbolDiamond, d3.symbolSquare, d3.symbolStar, d3.symbolTriangle, d3.symbolWye];
const colors = ['blue', 'green', 'red', 'cyan', 'gray', 'yellow', 'purple'];

let numPoints = 20000;
const speed = 0.1;

let data;
const generateData = () => {
  const numPerSeries = Math.floor(numPoints / symbols.length);
  data = symbols.map(s => {
    const series = [];
    for(let n = 0; n < numPerSeries; n++) {
      series.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        s: 50 + Math.random() * 50,
        dx: Math.random() * speed - speed / 2,
        dy: Math.random() * speed - speed / 2
      });
    }
    return series;
  });
}
generateData();

let showBorders = false;
const createSeries = (asWebgl) => {
  const seriesType = asWebgl ? fcWebgl.seriesWebglPoint : fc.seriesCanvasPoint;
  const multiType = asWebgl ? fcWebgl.seriesWebglMulti : fc.seriesCanvasMulti;
  
  var allSeries = symbols.map((symbol, i) =>
    seriesType()
      .size(d => d.s)
      .type(symbol)
      .decorate(context => {
        const color = d3.color(colors[i]);
        if (showBorders) {
          context.strokeStyle = color + '';
          context.strokeWidth = 1;
          color.opacity = 0.5;
        } else {
          context.strokeStyle = 'transparent';
          context.strokeWidth = 0;
        }
        context.fillStyle = color + '';
      })
  );

  return multiType()
    .series(allSeries)
    .mapping((data, index) => {
      return data[index];
    });
};

const createChart = (asWebgl) => {
  const chartComponent = asWebgl ? fcWebgl.cartesian : fc.chartCartesian;
  return chartComponent(d3.scaleLinear(), d3.scaleLinear())
    .yDomain([0, 100])
    .xDomain([0, 100])
    .canvasPlotArea(createSeries(asWebgl));
};
let chart = createChart(true);

const moveBubbles = () => {
  data.forEach(series => {
    series.forEach(b => {
      b.x += b.dx;
      b.y += b.dy;
  
      if (b.x > 100 || b.x < 0) b.dx = -b.dx;
      if (b.y > 100 || b.y < 0) b.dy = -b.dy;
    });
  });
}

d3.select("#seriesCanvas").on("click", () => restart(false));
d3.select("#seriesWebGL").on("click", () => restart(true));

d3.select("#withBorders").on("click", () => { showBorders = true; });
d3.select("#withoutBorders").on("click", () => { showBorders = false; });

let lastTime = 0;
const times = [];
let i = 0;

const showFPS = (t) => {
  const dt = t - lastTime;
  lastTime = t;
  times.push(dt);
  i++;
  if (times.length > 10) times.splice(0, 1);
  if (i > 10) {
    i = 0;
    const avg = times.reduce((s, t) => s + t, 0) / times.length;
    d3.select('#fps').text(`fps: ${Math.floor(1000 / avg)}`);
  }
};

const render = (t) => {
  showFPS(t);
  moveBubbles();

  // render
  d3.select('#content')
    .datum(data)
    .call(chart);

  if (stopRequest) {
    stopRequest();
  } else {
    requestAnimationFrame(render);
  }
}

const pointSlider = slider().max(50000).value(numPoints).on('change', value => {
  numPoints = value;
  generateData();
})
d3.select('#slider').call(pointSlider);

let stopRequest = null;
const stop = () => {
  return new Promise(resolve => {
    stopRequest = () => {
      stopRequest = null;
      resolve();
    };
  });
};
const start = () => requestAnimationFrame(render);

const restart = asWebgl => {
  stop().then(() => {
    d3.select('#content').html('');

    chart = createChart(asWebgl);

    start();
  });
};

start();
