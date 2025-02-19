const gridElement = document.getElementById("grid");
const startButton = document.getElementById("startButton");
const resetButton = document.getElementById("resetButton");
const speedSlider = document.getElementById("speedSlider");

const rows = 20;
const cols = 20;
let grid = [];
let startNode = null;
let goalNode = null;

function createGrid() {
  for (let row = 0; row < rows; row++) {
    const rowArray = [];
    for (let col = 0; col < cols; col++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.addEventListener("click", () => selectNode(cell));
      gridElement.appendChild(cell);
      rowArray.push(cell);
    }
    grid.push(rowArray);
  }
  addRandomWalls();
}

function addRandomWalls() {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (Math.random() < 0.2) {
        // 20% chance to be a wall
        const cell = grid[row][col];
        if (cell !== startNode && cell !== goalNode) {
          cell.classList.add("wall");
        }
      }
    }
  }
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
  addRandomWalls();
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
    const { row, col, distance } = queue.shift();
    const cell = grid[row][col];

    if (visited.has(cell) || cell.classList.contains("wall")) continue;
    visited.add(cell);

    if (cell !== startNode && cell !== goalNode) {
      cell.classList.add("visited");
      cell.textContent = distance;
      await sleep(parseInt(speedSlider.value));
    }

    if (row === goal.row && col === goal.col) {
      showPath(previous, goal);
      break;
    }

    for (const { row: dRow, col: dCol } of directions) {
      const newRow = row + dRow;
      const newCol = col + dCol;
      if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
        const newCell = grid[newRow][newCol];
        if (!visited.has(newCell) && !newCell.classList.contains("wall")) {
          queue.push({ row: newRow, col: newCol, distance: distance + 1 });
          previous[`${newRow},${newCol}`] = { row, col };
        }
      }
    }
  }
}

function showPath(previous, goal) {
  let { row, col } = goal;
  while (previous[`${row},${col}`]) {
    const cell = grid[row][col];
    cell.classList.add("path");
    cell.textContent = "";
    ({ row, col } = previous[`${row},${col}`]);
  }
}

createGrid();
startButton.addEventListener("click", visualizeDijkstra);
resetButton.addEventListener("click", resetGrid);
