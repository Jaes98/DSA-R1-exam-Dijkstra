// Import the MinHeap class
import MinHeap from "./MinHeap.js";

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
let graph = {}; // Graph representation

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
  buildGraph(); // Create graph representation
}

// Build the graph representation from the grid
function buildGraph() {
  graph = {};
  const directions = [
    { row: -1, col: 0 }, // up
    { row: 1, col: 0 }, // down
    { row: 0, col: -1 }, // left
    { row: 0, col: 1 }, // right
  ];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const nodeId = `${row},${col}`;
      graph[nodeId] = [];

      for (const { row: dRow, col: dCol } of directions) {
        const newRow = row + dRow;
        const newCol = col + dCol;
        if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
          graph[nodeId].push(`${newRow},${newCol}`);
        }
      }
    }
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

  const startCoord = {
    row: parseInt(startNode.dataset.row),
    col: parseInt(startNode.dataset.col),
  };
  const goalCoord = {
    row: parseInt(goalNode.dataset.row),
    col: parseInt(goalNode.dataset.col),
  };

  const startId = `${startCoord.row},${startCoord.col}`;
  const goalId = `${goalCoord.row},${goalCoord.col}`;

  const visited = new Set();
  const priorityQueue = new MinHeap();
  priorityQueue.insert({ nodeId: startId, distance: 0 });

  const distances = {};
  const previous = {};

  // Initialize distances
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const nodeId = `${row},${col}`;
      distances[nodeId] = Infinity;
    }
  }
  distances[startId] = 0;

  while (!priorityQueue.isEmpty()) {
    const { nodeId, distance } = priorityQueue.extractMin();
    const [row, col] = nodeId.split(",").map(Number);
    const cell = grid[row][col];

    if (nodeId === goalId) {
      showPath(previous, goalId, distances[goalId]);
      cellCounter.textContent = distances[goalId];
      break;
    }

    if (visited.has(nodeId) || cell.classList.contains("wall")) continue;

    // Add current class to highlight the node being processed
    if (cell !== startNode && cell !== goalNode) {
      cell.classList.add("current");
      await sleep(1010 - parseInt(speedSlider.value) / 2); // Show current node highlight
    }

    visited.add(nodeId);
    visitedNodesCount++;
    cellCounter.textContent = visitedNodesCount;

    if (cell !== startNode && cell !== goalNode) {
      cell.classList.remove("current"); // Remove current class
      cell.classList.add("visited");
      cell.textContent = distance;
      await sleep(1010 - parseInt(speedSlider.value)); // Invert the speed
    }

    for (const neighborId of graph[nodeId]) {
      if (visited.has(neighborId)) continue;

      const [neighborRow, neighborCol] = neighborId.split(",").map(Number);
      const neighborCell = grid[neighborRow][neighborCol];

      if (neighborCell.classList.contains("wall")) continue;

      const newDistance = distance + 1; // Edge weight is 1

      if (newDistance < distances[neighborId]) {
        distances[neighborId] = newDistance;
        previous[neighborId] = nodeId;
        priorityQueue.insert({ nodeId: neighborId, distance: newDistance });
      }
    }
  }
}

function showPath(previous, goalId, totalDistance) {
  let currentId = goalId;
  const path = [];

  while (previous[currentId]) {
    const [row, col] = currentId.split(",").map(Number);
    const cell = grid[row][col];
    path.push(cell);
    currentId = previous[currentId];
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
