import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCVtMeyc-5EmeCbFsEtJGHEYzyuuLcT8bA",
    authDomain: "shot-tracker-f9823.firebaseapp.com",
    projectId: "shot-tracker-f9823",
    storageBucket: "shot-tracker-f9823.appspot.com",
    messagingSenderId: "28405149666",
    appId: "1:28405149666:web:ef08e8add96e603838d3bb",
    measurementId: "G-FCJ9MQMQZJ"
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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

    const targetBall = document.createElement('div');
    targetBall.classList.add('ball', 'target-ball');

    // Append balls to the grid
    grid.appendChild(cueBall);
    grid.appendChild(targetBall);

    function placeBall(ball, row, col) {
        const index = row * cols + col;
        const cell = grid.children[index];

        if (cell) {
            const cellRect = cell.getBoundingClientRect();
            const gridRect = grid.getBoundingClientRect();

            const centerX = cellRect.left - gridRect.left + (cellRect.width / 2);
            const centerY = cellRect.top - gridRect.top + (cellRect.height / 2);

            const ballLeft = centerX - (ball.offsetWidth / 2);
            const ballTop = centerY - (ball.offsetHeight / 2);

            ball.style.position = 'absolute';
            ball.style.left = `${ballLeft}px`;
            ball.style.top = `${ballTop}px`;
        } else {
            console.error(`Cell at row ${row}, col ${col} does not exist.`);
        }
    }

    // Use a timeout to allow for ball dimensions to be calculated
    setTimeout(() => {
        placeBall(cueBall, 15, 5); // Default position
        placeBall(targetBall, 5, 5); // Default position
    }, 0);

    // Dragging functionality
    let draggedBall = null;
    let offsetX = 0;
    let offsetY = 0;

    function startDrag(ball, e) {
        draggedBall = ball;
        ball.style.zIndex = 10;

        const rect = ball.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX; // Handle touch event
        const clientY = e.touches ? e.touches[0].clientY : e.clientY; // Handle touch event

        offsetX = clientX - rect.left + (ball.offsetWidth / 6);
        offsetY = clientY - rect.top + (ball.offsetHeight / 6);

        e.preventDefault();
    }

    function moveBall(e) {
        if (draggedBall) {
            const relativeX = e.touches ? e.touches[0].clientX - grid.getBoundingClientRect().left : e.clientX - grid.getBoundingClientRect().left;
            const relativeY = e.touches ? e.touches[0].clientY - grid.getBoundingClientRect().top : e.clientY - grid.getBoundingClientRect().top;

            draggedBall.style.top = `${relativeY - offsetY}px`;
            draggedBall.style.left = `${relativeX - offsetX}px`;
        }
    }

    function endDrag() {
        if (draggedBall) {
            const cell = getCellUnderMouse(draggedBall);
            if (cell) {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                placeBall(draggedBall, row, col);
            }
            draggedBall = null;
        }
    }

    // Event listeners for both mouse and touch events
    [cueBall, targetBall].forEach(ball => {
        ball.addEventListener('mousedown', (e) => startDrag(ball, e));
        ball.addEventListener('touchstart', (e) => startDrag(ball, e), { passive: false }); // Prevent scrolling

        ball.addEventListener('mouseup', endDrag);
        ball.addEventListener('touchend', endDrag); // End drag on touch

        ball.addEventListener('mousemove', moveBall);
        ball.addEventListener('touchmove', (e) => {
            moveBall(e);
            e.preventDefault(); // Prevent scrolling
        }, { passive: false }); // Prevent scrolling
    });

    document.addEventListener('mousemove', moveBall);
    document.addEventListener('touchmove', (e) => {
        moveBall(e);
        e.preventDefault(); // Prevent scrolling
    }, { passive: false });

    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);

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

    function storeShot(state) {
        const shotData = {
            pocket: selectedPocket,
            cueBallLocation: { row: 15, col: 5 }, // Replace with actual values
            targetBallLocation: { row: 5, col: 5 }, // Replace with actual values
            state: state,
            timestamp: serverTimestamp() // No need for 'firebase' here
        };
    
        // Use the imported Firestore functions
        addDoc(collection(db, 'shots'), shotData)
            .then(() => {
                console.log('Shot stored successfully');
            })
            .catch((error) => {
                console.error('Error storing shot:', error);
            });
    }

    let selectedPocket = null;

    const pockets = document.querySelectorAll('.pocket');

    pockets.forEach(pocket => {
        pocket.addEventListener('click', (e) => {
            // Deselect all pockets (optional)
            pockets.forEach(p => p.classList.remove('selected'));

            // Set the selected pocket
            selectedPocket = e.currentTarget.dataset.pocket;
            console.log('Selected pocket:', selectedPocket);

            // Optionally, visually indicate the selected pocket
            e.currentTarget.classList.add('selected');
        });
    });

    document.getElementById('made-btn').addEventListener('click', () => {
        storeShot('made');
    });

    document.getElementById('miss-btn').addEventListener('click', () => {
        storeShot('miss');
    });
});
