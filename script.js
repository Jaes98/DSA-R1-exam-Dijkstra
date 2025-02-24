window.addEventListener("load", start);

let gridElement,
  startButton,
  resetButton,
  speedSlider,
  toggleButton,
  speedValue,
  cellCounter;
let wallMode = false;
let isMouseDown = false;

const rows = 20;
const cols = 20;

let grid = [];

let startNode = null;
let goalNode = null;
let visitedNodesCount = 0;

function createGrid() {
  for (let row = 0; row < rows; row++) {
    const rowArray = [];
    for (let col = 0; col < cols; col++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.addEventListener("mousedown", () => handleMouseDown(cell));
      cell.addEventListener("mousemove", () => handleMouseMove(cell));
      cell.addEventListener("mouseup", handleMouseUp);
      gridElement.appendChild(cell);
      rowArray.push(cell);
    }
    grid.push(rowArray);
  }
}

function handleMouseDown(cell) {
  isMouseDown = true;
  if (wallMode) {
    cell.classList.toggle("wall");
  } else {
    selectNode(cell);
  }
}

function handleMouseMove(cell) {
  if (isMouseDown && wallMode) {
    cell.classList.add("wall");
  }
}

function handleMouseUp() {
  isMouseDown = false;
}

function selectNode(cell) {
  if (!startNode) {
    startNode = cell;
    cell.classList.add("start");
  } else if (!goalNode) {
    goalNode = cell;
    cell.classList.add("goal");
  }
}

function resetGrid() {
  grid.forEach((row) =>
    row.forEach((cell) => {
      cell.className = "cell";
      cell.textContent = "";
    })
  );
  startNode = null;
  goalNode = null;
  visitedNodesCount = 0;
  cellCounter.textContent = "0";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function visualizeDijkstra() {
  if (!startNode || !goalNode) return;

  const start = {
    row: parseInt(startNode.dataset.row),
    col: parseInt(startNode.dataset.col),
  };
  const goal = {
    row: parseInt(goalNode.dataset.row),
    col: parseInt(goalNode.dataset.col),
  };
  const visited = new Set();
  const queue = [{ ...start, distance: 0 }];
  const directions = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
  ];
  const previous = {};

  while (queue.length > 0) {
    queue.sort((a, b) => a.distance - b.distance);
    const { row, col, distance } = queue.shift();
    const cell = grid[row][col];

    if (visited.has(cell) || cell.classList.contains("wall")) continue;
    visited.add(cell);
    visitedNodesCount++;
    cellCounter.textContent = visitedNodesCount;

    if (cell !== startNode && cell !== goalNode) {
      cell.classList.add("visited");
      cell.textContent = distance;
      await sleep(1010 - parseInt(speedSlider.value)); // Invert the speed
    }

    if (row === goal.row && col === goal.col) {
      showPath(previous, goal, distance);
      cellCounter.textContent = distance;
      break;
    }

    for (const { row: dRow, col: dCol } of directions) {
      const newRow = row + dRow;
      const newCol = col + dCol;
      if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
        const newCell = grid[newRow][newCol];
        if (!visited.has(newCell) && !newCell.classList.contains("wall")) {
          const newDistance = distance + 1;
          queue.push({ row: newRow, col: newCol, distance: newDistance });
          previous[`${newRow},${newCol}`] = { row, col, distance: newDistance };
        }
      }
    }
  }
}

function showPath(previous, goal, totalDistance) {
  let { row, col } = goal;
  const path = [];
  while (previous[`${row},${col}`]) {
    const cell = grid[row][col];
    path.push(cell);
    ({ row, col } = previous[`${row},${col}`]);
  }
  path.reverse();
  path.forEach((cell, index) => {
    cell.classList.add("path");
    cell.textContent = index + 1;
  });

  // Clear the numbers from non-path cells
  grid.forEach((row) =>
    row.forEach((cell) => {
      if (
        !cell.classList.contains("path") &&
        !cell.classList.contains("start") &&
        !cell.classList.contains("goal")
      ) {
        cell.textContent = "";
      }
    })
  );
}

function toggleWallMode() {
  wallMode = !wallMode;
  toggleButton.textContent = wallMode
    ? "Toggle Start/Goal Mode"
    : "Toggle Wall Mode";
}

function updateSpeedValue() {
  speedValue.textContent = `${1010 - speedSlider.value} ms`; // Inverted the speed to be more intuitive
}

function start() {
  gridElement = document.getElementById("grid");
  startButton = document.getElementById("startButton");
  resetButton = document.getElementById("resetButton");
  speedSlider = document.getElementById("speedSlider");
  toggleButton = document.getElementById("toggleButton");
  speedValue = document.getElementById("speedValue");
  cellCounter = document.getElementById("cellCounter");

  createGrid();
  startButton.addEventListener("click", visualizeDijkstra);
  resetButton.addEventListener("click", resetGrid);
  toggleButton.addEventListener("click", toggleWallMode);
  speedSlider.addEventListener("input", updateSpeedValue);
  updateSpeedValue(); // Initialize the speed value display

  document.addEventListener("mouseup", handleMouseUp); // Ensure mouseup is detected globally
}
