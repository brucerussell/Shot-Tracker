document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('.grid');
    const rows = 21;
    const cols = 11;

    // Create grid cells
    for (let i = 0; i < rows * cols; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.row = Math.floor(i / cols);
        cell.dataset.col = i % cols;
        grid.appendChild(cell);
    }

    // Create cue ball and target ball
    const cueBall = document.createElement('div');
    cueBall.classList.add('ball', 'cue-ball');
    placeBall(cueBall, 15, 5); // Default position

    const targetBall = document.createElement('div');
    targetBall.classList.add('ball', 'target-ball');
    placeBall(targetBall, 4, 5); // Default position

    // Append balls to the grid
    grid.appendChild(cueBall);
    grid.appendChild(targetBall);

    function placeBall(ball, row, col) {
        const index = row * cols + col;
        const cell = grid.children[index];

        if (cell) {
            const cellRect = cell.getBoundingClientRect();
            const gridRect = grid.getBoundingClientRect();
            console.log (cellRect);

            // Calculate center of the cell
            const centerX = cellRect.left - gridRect.left + (cellRect.width / 2);
            const centerY = cellRect.top - gridRect.top + (cellRect.height / 2);

            // Calculate top-left corner of the ball such that its center is at the cell's center
            const ballLeft = centerX - (ball.offsetWidth / 2);
            const ballTop = centerY - (ball.offsetHeight / 2);

            ball.style.position = 'absolute';
            ball.style.left = `${ballLeft}px`;
            ball.style.top = `${ballTop}px`;
        } else {
            console.error(`Cell at row ${row}, col ${col} does not exist.`);
        }
    }

    // Dragging functionality
    let draggedBall = null;
    let offsetX = 0;
    let offsetY = 0;

    [cueBall, targetBall].forEach(ball => {
        ball.addEventListener('mousedown', (e) => {
            draggedBall = ball;
            ball.style.zIndex = 10;

            const rect = ball.getBoundingClientRect();
            offsetX = e.clientX - rect.left + (ball.offsetWidth / 6);
            offsetY = e.clientY - rect.top + (ball.offsetHeight / 6);

            e.preventDefault();
        });
    });

    const gridRect = grid.getBoundingClientRect();

    document.addEventListener('mousemove', (e) => {
        if (draggedBall) {
            // Calculate cursor position relative to the grid
            const relativeX = e.clientX - gridRect.left;
            const relativeY = e.clientY - gridRect.top;

            // Set position based on relative cursor position and offsets
            draggedBall.style.top = `${relativeY - offsetY}px`;
            draggedBall.style.left = `${relativeX - offsetX}px`;
        }
    });

    document.addEventListener('mouseup', () => {
        if (draggedBall) {
            const cell = getCellUnderMouse(draggedBall);
            if (cell) {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                placeBall(draggedBall, row, col);
            }
            draggedBall = null;
        }
    });

    function getCellUnderMouse(ball) {
        const cells = Array.from(grid.children);
        for (const cell of cells) {
            const rect = cell.getBoundingClientRect();
            if (
                ball.getBoundingClientRect().left < rect.right &&
                ball.getBoundingClientRect().right > rect.left &&
                ball.getBoundingClientRect().top < rect.bottom &&
                ball.getBoundingClientRect().bottom > rect.top
            ) {
                return cell;
            }
        }
        return null;
    }
});
