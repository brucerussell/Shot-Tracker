export function createGrid(gridElement, rows, cols) {
    for (let i = 0; i < rows * cols; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.row = Math.floor(i / cols);
        cell.dataset.col = i % cols;
        gridElement.appendChild(cell);
    }
}

export function placeBall(ball, grid, row, col, cols, callback) {
    if (row < 0 || col < 0 || row >= grid.children.length / cols || col >= cols) {
        console.error('Invalid row or col for ball placement:', row, col);
        return;
    }

    const index = row * cols + col;
    const cell = grid.children[index];

    if (cell) {
        const cellRect = cell.getBoundingClientRect();
        const gridRect = grid.getBoundingClientRect();

        const centerX = cellRect.left - gridRect.left + (cellRect.width / 2);
        const centerY = cellRect.top - gridRect.top + (cellRect.height / 2);

        ball.style.position = 'absolute';
        ball.style.left = `${centerX - (ball.offsetWidth / 2)}px`;
        ball.style.top = `${centerY - (ball.offsetHeight / 2)}px`;

        if (callback) callback(row, col);
    } else {
        console.error(`Cell at row ${row}, col ${col} does not exist.`);
    }
}

