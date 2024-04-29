'use strict';

function userLoginOut() {
    // Save data to localStorage
    localStorage.removeItem('userName');
    localStorage.removeItem('userPassword');

    // Redirect user to another page
    window.location.href = 'login.html';
}

function openStats() {
    const dialog = document.getElementById("game-dialog");
    dialog.showModal();
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

        console.log(stamp);

        stampDiv.innerHTML = `
        <div style="position: relative;">
            <img src="assets/flags/${stamp.country_code}.png" style="width: 40px; position: absolute; top: 0; right: 0;">
        </div>
        <img src="assets/stamps/${stamp.img}" id="collected-stamp-img">
        <p id="collected-stamp-description">${stamp.name} <a style="text-decoration:none" href="${stamp.source}">🔗</a></p>        
        `
        console.log(stampDiv);

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
    const data = await response.json();
    return data;

}


async function getPlayerStamps(playerName) {

    const response = await fetch(`${apiUrl}/stamps/${playerName}`);
    if (!response.ok) throw new Error('Invalid server input!');
    const data = await response.json();

    return data;

}