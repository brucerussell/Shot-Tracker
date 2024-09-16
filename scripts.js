document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('.grid');
    const rows = 20;
    const cols = 10;

    // Create grid cells
    for (let i = 0; i < rows * cols; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.row = Math.floor(i / cols);
        cell.dataset.col = i % cols;
        cell.addEventListener('click', () => handleCellClick(cell));
        grid.appendChild(cell);
    }

    let selectedBall = null;
    let selectedPocket = null;

    function handleCellClick(cell) {
        if (selectedBall) {
            cell.classList.add(selectedBall);
            selectedBall = null;
        } else if (selectedPocket) {
            cell.classList.add('pocket');
            selectedPocket = null;
        } else {
            cell.classList.toggle('selected');
        }
    }

    // Example: Select cue ball
    document.querySelector('.cue-ball').addEventListener('click', () => {
        selectedBall = 'cue-ball';
    });

    // Example: Select target ball
    document.querySelector('.target-ball').addEventListener('click', () => {
        selectedBall = 'target-ball';
    });

    // Example: Select pocket
    document.querySelectorAll('.pocket').forEach(pocket => {
        pocket.addEventListener('click', () => {
            selectedPocket = 'pocket';
        });
    });
});
