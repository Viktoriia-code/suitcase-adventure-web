'use strict';

function userLoginOut() {
    // Save data to localStorage
    localStorage.removeItem('userName');
    localStorage.removeItem('userPassword');

    // Redirect user to another page
    window.location.href = 'login.html';
}

async function openStats() {
    const stats_response = await fetch(`${apiUrl}/statistics`);
    if (!stats_response.ok) throw new Error('Invalid server input!');
    const stats_data = await stats_response.json();
    const dialog = document.getElementById("game-dialog");
    dialog.innerHTML = ''; // Reset the dialog content
    dialog.innerHTML += '<h2>📊 Statistics for all completed games</h2>';

    const nZeroFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
    const nOneFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });
    
    const co2 = nZeroFormat.format(stats_data[0][0]);
    const flights = nOneFormat.format(stats_data[0][1]);
    const gamesCompleted = stats_data[0][2];

    dialog.innerHTML +=
        `<h3>Average co2 consumption</h3><p class="stat-data">${co2} kg</p>` +
        `<h3>Average flight amount</h3><p class="stat-data">${flights}</p>` +
        `<h3>Number of completed games</h3><p class="stat-data">${gamesCompleted}</p>`;
    let closeBtn = document.createElement('button');
    closeBtn.innerText = 'Close';
    closeBtn.classList.add('sound-btn');
    dialog.appendChild(closeBtn);

    dialog.showModal();

    closeBtn.addEventListener("click", () => {
        let clickSound = new Audio('assets/sounds/click.wav');
        clickSound.volume = 0.3;
        sounds && clickSound.play();
        dialog.close();
    });
}

// Function to open the modal with custom title and content
function openRules() {
    const dialog = document.getElementById("game-dialog");
    dialog.innerHTML = ''; // Reset the dialog content
    dialog.innerHTML += '<h2>Game Rules</h2>';

    dialog.innerHTML += `<p> Game aim: You're a lost suitcase. Your task is to find your owner in one of the largest airports in the world in a minimum number of flights. Choose the airport carefully – the fewer flights, the less emissions into the atmosphere!</p>` +
        `<br><br>
            Game play: To select an airport, follow the prompts of the game. The distance to the owner will tell
            you which continent, country, or airport is better to choose. To save your progress and go to the
            main menu, enter "menu" at any time when choosing a direction.
            <br><br>
            Winning: The game ends if you guess the location of your owner. After that, you can choose to start
            a new game or return to the main menu.
            <br><br>
            Statistics: To compare your result with the average results of all players, select the "Statistics"
            option in the header menu.
            <br><br>
            Music: To turn off/turn on background music, use the option provided in the header menu.
            </p>`;
    let closeBtn = document.createElement('button');
    closeBtn.innerText = 'Close';
    closeBtn.classList.add('sound-btn');
    dialog.appendChild(closeBtn);

    dialog.showModal();

    closeBtn.addEventListener("click", () => {
        let clickSound = new Audio('assets/sounds/click.wav');
        clickSound.volume = 0.3;
        sounds && clickSound.play();
        dialog.close();
    });
}

async function openStamps() {
    const dialog = document.getElementById("show-stamps");
    const stampsContainer = document.querySelector(".stamps-collection");
    const closeButton = document.getElementById("show-stamps-btn");

    const playerName = localStorage.getItem("userName");
    const stampsInfo = await getAllStamps();

    const myStamps = await getPlayerStamps(playerName);

    const myStampsLength = myStamps["stamps"].length;
    const allStampsLength = Object.keys(stampsInfo).length;

    const collectionTitle = document.getElementById("stamps-collection-title");
    collectionTitle.innerHTML = `My Stamps (${myStampsLength}/${allStampsLength})`

    stampsContainer.innerHTML = '';

    if (myStampsLength !== 0) {
        for (let stampName of myStamps["stamps"]) {
            const stamp = stampsInfo[stampName];

            const stampDiv = document.createElement("div");
            stampDiv.classList.add("stamp-info");

            stampDiv.innerHTML = `
            <div style="position: relative;">
                <img src="assets/flags/${stamp.country_code}.png" style="width: 40px; position: absolute; top: 0; right: 0;">
            </div>
            <img src="assets/stamps/${stamp.img}" id="collected-stamp-img">
            <p id="collected-stamp-description">${stamp.name} <a style="text-decoration:none" href="${stamp.source}">🔗</a></p>        
            `

            stampsContainer.appendChild(stampDiv);

        }
    }

    else {

        const stampDiv = document.createElement("div");
        stampDiv.innerHTML = '<h3>Travel and collect World Landmark Stamps into your unique collection! 😃<h3>';

        stampsContainer.appendChild(stampDiv);
    }

    dialog.showModal();

    closeButton.addEventListener("click", () => {
        dialog.close();
    });
}

function toggleFunction() {
    var x = document.getElementById("toggleButtons");
    x.classList.toggle("toggled");
}


// --------------------- API GET FUNCTIONS ------------------------------
async function getAllStamps() {

    const response = await fetch(`${apiUrl}/stamps`);
    if (!response.ok) throw new Error('Invalid server input!');
    return await response.json();

}


async function getPlayerStamps(playerName) {

    const response = await fetch(`${apiUrl}/stamps/${playerName}`);
    if (!response.ok) throw new Error('Invalid server input!');
    return await response.json();

}