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

    dialog.innerHTML +=
                `<h3>Average co2 consumption</h3><p class="stat-data">${stats_data[0][0]} kg</p>` +
                `<h3>Average flight amount</h3><p class="stat-data">${stats_data[0][1]}</p>` +
                `<h3>Number of completed games</h3><p class="stat-data">${stats_data[0][2]}</p>`;
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

    stampsContainer.innerHTML = '';

    for (let stampName of myStamps["stamps"]) {
        const stamp = stampsInfo[stampName];

        const stampDiv = document.createElement("div");
        stampDiv.classList.add("stamp-info");

        // console.log(stamp);

        stampDiv.innerHTML = `
        <div style="position: relative;">
            <img src="assets/flags/${stamp.country_code}.png" alt="Country stamp flag" style="width: 40px; position: absolute; top: 0; right: 0;">
        </div>
        <img src="assets/stamps/${stamp.img}" alt="Country stamp image" id="collected-stamp-img">
        <p id="collected-stamp-description">${stamp.name} <a style="text-decoration:none" href="${stamp.source}">🔗</a></p>        
        `
        // console.log(stampDiv);

        stampsContainer.appendChild(stampDiv);

    } 
    
    dialog.showModal();

    closeButton.addEventListener("click", () => {
        dialog.close();
    });
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