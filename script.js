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

let graph = {}; // Adjacency list representation of the grid

let terrainMode = "node";
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
  buildGraph();
}

// Build the graph representation from the grid
function buildGraph() {
  graph = {};
  const directions = [
    { row: -1, col: 0 }, // up
    { row: 1, col: 0 },  // down
    { row: 0, col: -1 }, // left
    { row: 0, col: 1 },  // right
  ];
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const nodeId = `${row},${col}`;
      graph[nodeId] = [];
      
      for (const { row: dRow, col: dCol } of directions) {
        const newRow = row + dRow;
        const newCol = col + dCol;
        
        if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
          const neighborId = `${newRow},${newCol}`;
          const neighborCell = grid[newRow][newCol];
          
          let weight = 1;
          if (neighborCell.classList.contains("desert")) {
            weight = 3;
          }
          
          graph[nodeId].push({ 
            id: neighborId, 
            weight: weight 
          });
        }
      }
    }
  }
}

function updateGraphWeights(cell) {
  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);
  const nodeId = `${row},${col}`;

  // Update this cell's weight in all its neighbors' edges
  const directions = [
    { row: -1, col: 0 }, // up
    { row: 1, col: 0 }, // down
    { row: 0, col: -1 }, // left
    { row: 0, col: 1 }, // right
  ];

  for (const { row: dRow, col: dCol } of directions) {
    const neighborRow = row + dRow;
    const neighborCol = col + dCol;

    if (
      neighborRow >= 0 &&
      neighborRow < rows &&
      neighborCol >= 0 &&
      neighborCol < cols
    ) {
      const neighborId = `${neighborRow},${neighborCol}`;

      // Finds the node in the neighbor's edge list and updates the weight
      if (graph[neighborId]) {
        for (let edge of graph[neighborId]) {
          if (edge.id === nodeId) {
            // Sets weight based on type of node
            if (cell.classList.contains("wall")) {
            } else if (cell.classList.contains("desert")) {
              edge.weight = 3;
            } else {
              edge.weight = 1;
            }
            break;
          }
        }
      }
    }
  }

  // Also update edges from this node to its neighbors
  if (graph[nodeId]) {
    graph[nodeId] = [];

    for (const { row: dRow, col: dCol } of directions) {
      const neighborRow = row + dRow;
      const neighborCol = col + dCol;

      if (
        neighborRow >= 0 &&
        neighborRow < rows &&
        neighborCol >= 0 &&
        neighborCol < cols
      ) {
        const neighborId = `${neighborRow},${neighborCol}`;
        const neighborCell = grid[neighborRow][neighborCol];

        let weight = 1;
        if (neighborCell.classList.contains("desert")) {
          weight = 3;
        }

        graph[nodeId].push({
          id: neighborId,
          weight: weight,
        });
      }
    }
  }
}

function handleMouseDown(cell) {
  isMouseDown = true;
  if (terrainMode === "wall") {
    cell.classList.toggle("wall");
    updateGraphWeights(cell);
  } else if (terrainMode === "desert") {
    cell.classList.remove("wall");
    cell.classList.toggle("desert");
    updateGraphWeights(cell);
  } else {
    selectNode(cell);
  }
}

function handleMouseMove(cell) {
  if (!isMouseDown) return;

  if (terrainMode === "wall") {
    cell.classList.remove("desert");
    cell.classList.add("wall");
    updateGraphWeights(cell);
  } else if (terrainMode === "desert") {
    cell.classList.remove("wall");
    cell.classList.add("desert");
    updateGraphWeights(cell);
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

    if (cell !== startNode && cell !== goalNode) {
      cell.classList.add("current");
      await sleep(Math.max(1, (1010 - parseInt(speedSlider.value)) / 10));
    }

    visited.add(nodeId);
    visitedNodesCount++;
    cellCounter.textContent = visitedNodesCount;

    if (cell !== startNode && cell !== goalNode) {
      cell.classList.remove("current");
      cell.classList.add("visited");
      cell.textContent = distance;
      await sleep(Math.max(1, (1010 - parseInt(speedSlider.value)) / 5));
    }

    for (const neighbor of graph[nodeId]) {
      const neighborId = neighbor.id;
      const weight = neighbor.weight;

      if (visited.has(neighborId)) continue;

      const [neighborRow, neighborCol] = neighborId.split(",").map(Number);
      const neighborCell = grid[neighborRow][neighborCol];

      if (neighborCell.classList.contains("wall")) continue;

      const newDistance = distance + weight;

      if (newDistance < distances[neighborId]) {
        distances[neighborId] = newDistance;
        previous[neighborId] = nodeId;
        priorityQueue.insert({ nodeId: neighborId, distance: newDistance });
      }
    }
  }
}

// Reconstruct shortest path using the previous pointers
function showPath(previous, goalId, totalDistance) {
  let currentId = goalId;
  const path = [];

  while (previous[currentId]) {
    const [row, col] = currentId.split(",").map(Number);
    const cell = grid[row][col];
    path.push({ cell, id: currentId });
    currentId = previous[currentId];
  }

  path.reverse();

  let cumulativeDistance = 0;
  for (let i = 0; i < path.length; i++) {
    const { cell, id } = path[i];
    cell.classList.add("path");

    // Get the previous node and calculate edge weight
    if (i > 0) {
      const prevId = path[i - 1].id;
      for (const neighbor of graph[prevId]) {
        if (neighbor.id === id) {
          cumulativeDistance += neighbor.weight;
          break;
        }
      }
    }

    cell.textContent = cumulativeDistance;
  }

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

function toggleTerrainMode() {
  if (terrainMode === "node") {
    terrainMode = "wall";
    toggleButton.textContent = "Wall Mode (Switch to Desert) 1/3";
  } else if (terrainMode === "wall") {
    terrainMode = "desert";
    toggleButton.textContent = "Desert Mode (Switch to Node) 2/3";
  } else {
    terrainMode = "node";
    toggleButton.textContent = "Start/Goal Mode (Switch to Wall) 3/3";
  }
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
  toggleButton.addEventListener("click", toggleTerrainMode);
  speedSlider.addEventListener("input", updateSpeedValue);
  updateSpeedValue();

  document.addEventListener("mouseup", handleMouseUp);
}
