import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { setupAuth, logoutUser } from './auth.js';

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
const auth = getAuth(app); // where `app` is your initialized Firebase app

// Set up auth-related UI
setupAuth(auth);

let currentUserUid = null;

document.addEventListener('DOMContentLoaded', () => {

    currentUserUid = localStorage.getItem('currentUserUid'); // Retrieve UID
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUserUid = user.uid; // Set the user ID when logged in
            console.log('Current user UID:', currentUserUid); // Debugging line

            // Display user's email
            document.getElementById('user-email').textContent = `User: ${user.email}`;
        } else {
            currentUserUid = null; // Reset when logged out
            document.getElementById('user-email').textContent = ''; // Clear email
        }
    });

    // Logout function
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await logoutUser(auth);
    });

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

    let cueBallPosition = { row: 15, col: 5 }; // Initial position
    let targetBallPosition = { row: 5, col: 5 }; // Initial position
    
    function placeBall(ball, row, col) {
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
    
            const isCueBall = ball.classList.contains('cue-ball');
            const isTargetBall = ball.classList.contains('target-ball');
    
            if (isCueBall || isTargetBall) {
                const newPosition = { row, col };
                if (isCueBall) cueBallPosition = newPosition;
                else if (isTargetBall) targetBallPosition = newPosition;
    
                generateHeatMapWithDebounce();  // Trigger debounced heat map generation
            }
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
    let isDragging = false;
    let draggedBall = null;
    let offsetX = 0;
    let offsetY = 0;

    document.addEventListener('mousemove', moveBall);
    document.addEventListener('touchmove', (e) => {
        moveBall(e);
        if (isDragging) {
            e.preventDefault(); // Prevent scrolling when dragging
        }
    }, { passive: false });

    function startDrag(ball, e) {
        draggedBall = ball;
        isDragging = true;
        // Calculate offsets and set the ball for dragging...
    }

    function moveBall(e) {
        if (!isDragging || !draggedBall) return;

        // Differentiate between touch and mouse
        let clientX, clientY;
        if (e.touches) {  // Touch event
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {  // Mouse event
            clientX = e.clientX;
            clientY = e.clientY;
        }

        // Calculate position relative to the grid
        const gridRect = grid.getBoundingClientRect();
        const relativeX = clientX - gridRect.left;
        const relativeY = clientY - gridRect.top;

        draggedBall.style.left = `${relativeX - offsetX}px`;
        draggedBall.style.top = `${relativeY - offsetY}px`;
    }

    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);

    function endDrag() {
        if (!draggedBall) return;

        const cell = getCellUnderMouse(draggedBall);
        if (cell) {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            placeBall(draggedBall, row, col);
        }
        draggedBall = null;
        isDragging = false;
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
            if (isDragging) {
                e.preventDefault(); // Prevent scrolling only if dragging
            }
        }, { passive: false });
    });

    document.addEventListener('mousemove', moveBall);
    document.addEventListener('touchmove', (e) => {
        moveBall(e);
        if (isDragging) {
            e.preventDefault(); // Prevent scrolling only if dragging
        }
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
        if (!currentUserUid) {
            console.error('No user is logged in. Shot cannot be stored.');
            return;
        }

        const shotData = {
            userId: currentUserUid, // Add user ID to the shot data
            pocket: selectedPocket,
            cueBallLocation: cueBallPosition,
            targetBallLocation: targetBallPosition,
            state: state,
            timestamp: serverTimestamp()
        };
    
        addDoc(collection(db, 'shots'), shotData)
            .then(() => {
                console.log('Shot stored successfully');
            })
            .catch((error) => {
                console.error('Error storing shot:', error);
            });
    }   

    let selectedPocket = "top-left";

    // Find the top-left pocket and add the 'selected' class to it
    const topLeftPocket = document.querySelector('.pocket[data-pocket="top-left"]');
    topLeftPocket.classList.add('selected');

    const pockets = document.querySelectorAll('.pocket');

    pockets.forEach(pocket => {
        pocket.addEventListener('click', (e) => {
            pockets.forEach(p => p.classList.remove('selected'));
            selectedPocket = e.currentTarget.dataset.pocket;
            e.currentTarget.classList.add('selected');

            generateHeatMapWithDebounce();  // Trigger debounced heat map generation
        });
    });

    document.getElementById('made-btn').addEventListener('click', () => {
        storeShot(true);
        generateHeatMapWithDebounce();  // Trigger debounced heat map generation
    });

    document.getElementById('miss-btn').addEventListener('click', () => {
        storeShot(false);
        generateHeatMapWithDebounce();  // Trigger debounced heat map generation
    });

    async function getShotsForCueBallAndPocket(cueBallPosition, selectedPocket) {
        if (!currentUserUid) {
            console.error('No user is logged in.');
            return [];
        }
    
        const shotsRef = collection(db, 'shots');
        const q = query(
            shotsRef,
            where('cueBallLocation', '==', cueBallPosition),
            where('pocket', '==', selectedPocket),
            where('userId', '==', currentUserUid) // Filter by logged-in user's UID
        );
        const snapshot = await getDocs(q);
        const shots = snapshot.docs.map(doc => doc.data());
        return shots;
    }

    function calculateSuccessPercentages(shots) {
        const gridStats = {};
    
        shots.forEach(shot => {
            const { targetBallLocation, state } = shot; // use 'state' instead of 'made'
            const key = `${targetBallLocation.row}-${targetBallLocation.col}`;
        
            if (!gridStats[key]) {
                gridStats[key] = { madeCount: 0, totalCount: 0 };
            }
        
            gridStats[key].totalCount++;
            if (state) {  // 'state' tracks whether the shot was made
                gridStats[key].madeCount++;
            }
        });
    
        // Calculate the percentage for each grid cell
        Object.keys(gridStats).forEach(key => {
            const { madeCount, totalCount } = gridStats[key];
            gridStats[key].percentage = madeCount / totalCount; // Calculate the success percentage
        });
    
        return gridStats;
    }
    
    function getColorFromPercentage(percentage) {
        const red = Math.round(255 * (1 - percentage)); // More red when percentage is low
        const green = Math.round(255 * percentage);     // More green when percentage is high
        return `rgba(${red}, ${green}, 0, 0.3)`;              // Ranges from red (0%) to green (100%)
    }

    function colorGrid(gridStats) {
        const cells = document.querySelectorAll('.grid .cell');
        
        cells.forEach(cell => {
            const row = cell.dataset.row;
            const col = cell.dataset.col;
            const key = `${row}-${col}`;
        
            if (gridStats[key]) {
                const percentage = gridStats[key].percentage;
                const color = getColorFromPercentage(percentage);
                cell.style.backgroundColor = color;
            } else {
                // Set background color to transparent if no data exists for this cell
                cell.style.backgroundColor = 'transparent';
            }
        });
    }    

    let heatMapTimeout;

    function generateHeatMapWithDebounce() {
        clearTimeout(heatMapTimeout);
        heatMapTimeout = setTimeout(() => generateHeatMap(), 50); // Adjust the delay as needed
    }

    async function generateHeatMap() {
        // Get shots for the current cue ball position and selected pocket
        const shots = await getShotsForCueBallAndPocket(cueBallPosition, selectedPocket);
        const gridStats = calculateSuccessPercentages(shots);
        colorGrid(gridStats);
    
        // Display the percentage and shot count for the current target ball position
        const key = `${targetBallPosition.row}-${targetBallPosition.col}`;
        const shotInfoDisplay = document.getElementById('shot-info');
    
        if (gridStats[key]) {
            const { madeCount, totalCount } = gridStats[key];
            const percentage = Math.round((madeCount / totalCount) * 100);  // Calculate percentage
            shotInfoDisplay.innerHTML = `
                <div class="shot-info">${totalCount} shots taken</div>
                <div class="shot-info">${percentage}% success</div>
            `;
        } else {
            shotInfoDisplay.innerHTML = '<div class="shot-info">No shots here</div>';
        }
    }
    
});
