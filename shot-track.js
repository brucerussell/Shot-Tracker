import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { setupAuth, logoutUser } from './auth.js';
import { createGrid, placeBall } from './grid.js';

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

    createGrid(grid, rows, cols); // Create the grid

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
    
    // Place initial ball positions
    setTimeout(() => {
        placeBall(cueBall, grid, 15, 5, cols, (row, col) => {
            cueBallPosition = { row, col };
            generateHeatMapWithDebounce(); // Recalculate the heatmap
        });
        placeBall(targetBall, grid, 5, 5, cols, (row, col) => {
            targetBallPosition = { row, col };
            generateHeatMapWithDebounce();
        });
    }, 0);

    // Dragging functionality
    let isDragging = false;
    let draggedBall = null;
    let offsetX = 10;
    let offsetY = 40;

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
            const row = parseInt(cell.dataset.row, 10);
            const col = parseInt(cell.dataset.col, 10);
    
            if (!isNaN(row) && !isNaN(col)) {
                placeBall(draggedBall, grid, row, col, cols, (r, c) => {
                    if (draggedBall.classList.contains('cue-ball')) {
                        cueBallPosition = { row: r, col: c };
                    } else if (draggedBall.classList.contains('target-ball')) {
                        targetBallPosition = { row: r, col: c };
                    }
                    generateHeatMapWithDebounce();
                });
            } else {
                console.error('Invalid row or col:', row, col);
            }
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
            const ballRect = ball.getBoundingClientRect();
    
            // Check if the ball overlaps with the cell
            if (
                ballRect.left < rect.right &&
                ballRect.right > rect.left &&
                ballRect.top < rect.bottom &&
                ballRect.bottom > rect.top
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

    //These are all the shots for a given cueball + pocket
    async function getShotsForHeatmap(cueBallPosition, selectedPocket) {
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
        const shots = snapshot.docs.map(doc => ({
            ...doc.data(),
            timestamp: doc.data().timestamp.toDate() // Convert Firestore timestamp to JavaScript Date
        }));
        return shots;
    }

    //These are all the shots at a specific cue + target + pocket
    async function getShotsForHere(cueBallPosition, targetBallPosition, selectedPocket) {
        if (!currentUserUid) {
            console.error('No user is logged in.');
            return [];
        }
    
        const shotsRef = collection(db, 'shots');
        const q = query(
            shotsRef,
            where('cueBallLocation', '==', cueBallPosition),
            where('targetBallLocation', '==', targetBallPosition), // Match target ball position
            where('pocket', '==', selectedPocket),
            where('userId', '==', currentUserUid) // Filter by logged-in user's UID
        );
    
        const snapshot = await getDocs(q);
        const shots = snapshot.docs.map(doc => ({
            ...doc.data(),
            timestamp: doc.data().timestamp.toDate() // Convert Firestore timestamp to JavaScript Date
        }));
        return shots;
    }

    function groupShotsByDate(shots) {
        const groupedByDate = {};
    
        shots.forEach(shot => {
            const date = shot.timestamp.toISOString().split('T')[0]; // Extract date in YYYY-MM-DD format
            if (!groupedByDate[date]) {
                groupedByDate[date] = { madeCount: 0, totalCount: 0 };
            }
    
            groupedByDate[date].totalCount++;
            if (shot.state) {  // 'state' tracks whether the shot was made
                groupedByDate[date].madeCount++;
            }
        });
    
        // Convert the grouped data into an array of objects sorted by date (most recent first)
        return Object.entries(groupedByDate).map(([date, { madeCount, totalCount }]) => ({
            date,
            madeCount,
            totalCount,
            percentage: Math.round((madeCount / totalCount) * 100)
        })).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    function renderShotList(shotsGroupedByDate) {
        const shotListContainer = document.getElementById('shot-list');
        shotListContainer.innerHTML = ''; // Clear the previous list
    
        if (shotsGroupedByDate.length === 0) {
            shotListContainer.innerHTML = '<li id="no-shots">No shots recorded for this position.</li>';
            return;
        }
    
        shotsGroupedByDate.forEach(shotData => {
            // Create the list item container
            const listItem = document.createElement('li');
            listItem.classList.add('shot-list-item');
    
            // Format the date to 'MM/DD'
            const date = new Date(shotData.date);
            const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`; // Convert to MM/DD format
    
            // Create a div for the bar based on the percentage
            const percentageBar = document.createElement('div');
            percentageBar.classList.add('percentage-bar');
            percentageBar.style.width = `${shotData.percentage}%`; // Width of the bar based on the percentage
    
            // Add text on top of the bar
            const shotDayLabel = document.createElement('div');
            shotDayLabel.classList.add('shot-date');
            const dateTextContent = `${formattedDate}`;
            shotDayLabel.textContent = dateTextContent;

            const shotCount = document.createElement('div');
            shotCount.classList.add('shot-count');
            const countTextContent = `Attempts: ${shotData.totalCount}`;
            shotCount.textContent = countTextContent;

            const shotPercentage = document.createElement('div');
            shotPercentage.classList.add('shot-percentage');
            const percentTextContent = `${shotData.percentage}%`;
            shotPercentage.textContent = percentTextContent;
    
            // Append the bar to the list item
            listItem.appendChild(percentageBar);
            listItem.appendChild(shotDayLabel);
            listItem.appendChild(shotCount);
            listItem.appendChild(shotPercentage);
            shotListContainer.appendChild(listItem);
        });
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
        // Query for the heatmap using only cueBallPosition and selectedPocket
        const shotsForHeatmap = await getShotsForHeatmap(cueBallPosition, selectedPocket);
        const gridStats = calculateSuccessPercentages(shotsForHeatmap);
        colorGrid(gridStats);
    
        // Query for the shot list using cueBallPosition, targetBallPosition, and selectedPocket
        const shotsForList = await getShotsForHere(cueBallPosition, targetBallPosition, selectedPocket);
        
        // Group shots by date and render the shot list
        const shotsGroupedByDate = groupShotsByDate(shotsForList);
        renderShotList(shotsGroupedByDate);
    
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
