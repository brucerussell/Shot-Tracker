import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

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
        await logoutUser();
    });

    function storeShot(state) {
        if (!currentUserUid) {
            console.error('No user is logged in. Shot cannot be stored.');
            return;
        }

        const shotData = {
            userId: currentUserUid,
            pocket: selectedPocket,
            cueBallLocation: cueBallPosition,
            targetBallLocation: targetBallPosition,
            made: isMade,
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

            // Update positions
            if (ball.classList.contains('cue-ball')) {
                cueBallPosition = { row, col };
                generateHeatMap();  // Trigger heat map generation when cue ball moves
            } else if (ball.classList.contains('target-ball')) {
                targetBallPosition = { row, col };
                generateHeatMap();  // Trigger heat map generation when cue ball moves
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
    let draggedBall = null;
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;

    function startDrag(ball, e) {
        draggedBall = ball;
        ball.style.zIndex = 10;

        const rect = ball.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX; // Handle touch event
        const clientY = e.touches ? e.touches[0].clientY : e.clientY; // Handle touch event

        offsetX = clientX - rect.left + (ball.offsetWidth / 2);
        offsetY = clientY - rect.top + (ball.offsetHeight / 2);

        e.preventDefault(); // Prevent default behavior
        isDragging = true; // Set dragging flag
    }

    function moveBall(e) {
        if (draggedBall && isDragging) {
            const relativeX = (e.touches ? e.touches[0].clientX : e.clientX) - grid.getBoundingClientRect().left;
            const relativeY = (e.touches ? e.touches[0].clientY : e.clientY) - grid.getBoundingClientRect().top;

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
            isDragging = false; // Reset dragging flag
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
            // Deselect all pockets (optional)
            pockets.forEach(p => p.classList.remove('selected'));

            // Set the selected pocket
            selectedPocket = e.currentTarget.dataset.pocket;

            // Optionally, visually indicate the selected pocket
            e.currentTarget.classList.add('selected');

            // Generate a new heat map
            generateHeatMap();
        });
    });

    document.getElementById('made-btn').addEventListener('click', () => {
        storeShot(true);
        generateHeatMap();  // Trigger heat map generation when new shot
    });

    document.getElementById('miss-btn').addEventListener('click', () => {
        storeShot(false);
        generateHeatMap();  // Trigger heat map generation when new shot
    });

    async function getShotsForCueBallAndPocket(cueBallPosition, selectedPocket) {
        const shotsRef = collection(db, 'shots');
        const q = query(
            shotsRef,
            where('cueBallLocation', '==', cueBallPosition),
            where('pocket', '==', selectedPocket)
        );
        const snapshot = await getDocs(q);
        const shots = snapshot.docs.map(doc => doc.data());

        // Debugging: Log retrieved shots
        console.log("Retrieved shots:", shots);

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

    async function generateHeatMap() {
        // Get shots for the current cue ball position and selected pocket
        const shots = await getShotsForCueBallAndPocket(cueBallPosition, selectedPocket);
        const gridStats = calculateSuccessPercentages(shots);
        colorGrid(gridStats);
    
        // Display the percentage for the current target ball position
        const key = `${targetBallPosition.row}-${targetBallPosition.col}`;
        const shotPercentageDisplay = document.getElementById('shot-percentage');
    
        if (gridStats[key]) {
            const { madeCount, totalCount } = gridStats[key];
            const percentage = Math.round((madeCount / totalCount) * 100);  // Calculate percentage
            shotPercentageDisplay.textContent = `${percentage}% success`;
        } else {
            shotPercentageDisplay.textContent = "No shots here";
        }
    }
});

// Function to log out a user
async function logoutUser() {
    try {
        await signOut(auth);
        console.log('User logged out');
        localStorage.removeItem('currentUserUid'); // Clear UID from localStorage
        window.location.href = 'index.html'; // Redirect to login page
    } catch (error) {
        console.error('Logout error:', error);
    }
}
