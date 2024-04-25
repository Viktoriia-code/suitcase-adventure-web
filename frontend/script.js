'use strict';

// --------------------- MAP ------------------------------

const map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// in the future, here we can set a suitcase, which the player chooses, but for now so
var greenIcon = L.icon({
    iconUrl: '/frontend/assets/travel-bag.png',
    iconSize: [40, 40],
});

// --------------------- GLOBAL VARIABLES ------------------------------

//const testGameId = 4; // UPDATE LATER WHEN "NEW_GAME" FEATURE IS ADDED!
const apiUrl = 'http://127.0.0.1:5000';
const airportMarkers = L.featureGroup().addTo(map);

// --------------------- MAIN LOOP ------------------------------

// main loop, based on buttons on the map
// after each click (other words - after choosing the airport where to fly), the entire page is updated to make it easier to track the moment when the player reaches the goal 

async function gameSetup(gameID, username) {

    try {

        const playerInfo = await getPlayerData(username);
        updatePlayerInfoOnPage(playerInfo);

        const airportsList = await getAirportList(gameID);
        updateAirportsListOnPage(airportsList);

        airportMarkers.clearLayers();

        // Plot markers on the map
        airportsList.forEach(airport => {

            var marker = L.marker([airport.lat, airport.long]).addTo(map);
            airportMarkers.addLayer(marker);

            if (airport.code === playerInfo.current_location) {

                const popupContent = document.createElement('div');

                const h4 = document.createElement('h4');
                h4.innerHTML = airport.name;

                const h5 = document.createElement('h5');
                h5.classList.add('GEO');
                h5.innerHTML = `You are here!`;

                const pCity = document.createElement('p');
                pCity.innerHTML = `City | ${airport.city}`;

                const pCountry = document.createElement('p');
                pCountry.innerHTML = `Country | ${airport.country}`;

                popupContent.append(h4);
                popupContent.append(h5);
                popupContent.append(pCity);
                popupContent.append(pCountry);

                marker.bindPopup(popupContent);

                marker.setIcon(greenIcon);
            }

            else {

                const popupContent = document.createElement('div');

                const h4 = document.createElement('h4');
                h4.innerHTML = airport.name;

                const goButton = document.createElement('button');
                goButton.classList.add('fly-button');
                goButton.innerHTML = 'Fly here';


                const pCity = document.createElement('p');
                pCity.innerHTML = `City | ${airport.city}`;

                const pCountry = document.createElement('p');
                pCountry.innerHTML = `Country | ${airport.country}`;

                popupContent.append(h4);
                popupContent.append(goButton);
                popupContent.append(pCity);
                popupContent.append(pCountry);

                marker.bindPopup(popupContent);



                // very important - here we can later trace if the goal is reached
                goButton.addEventListener('click', async function () {

                    const result = await updatePlayerLocation(gameID, airport.code);

                    console.log(result.win); // if true, we can ask a player for example if to start a new game by unhiding some DIV element or HTML 


                    await gameSetup(gameID,username);

                });
            }

        });

    } catch (error) {
        console.log(error);
    }

}

// --------------------- API GET FUNCTIONS ------------------------------

// returns all data from "available_airport" table in SQL
async function getAirportList(gameId) {
    const response = await fetch(`${apiUrl}/airports/${gameId}`);
    if (!response.ok) throw new Error('Invalid server input!');
    const data = await response.json();

    return data;
}

// returns data about the player
async function getPlayerData(username) {
    const response = await fetch(`${apiUrl}/users/${username}`);
    if (!response.ok) throw new Error('Invalid server input!');
    const data = await response.json();

    return data;
}

// returns "true" if players wins or "false" if not
async function updatePlayerLocation(gameId, icao) {

    const response = await fetch(`${apiUrl}/flyto/${gameId}/${icao}`);
    if (!response.ok) throw new Error('Invalid server input!');
    const data = await response.json();

    return data;

}

// --------------------- WEB PAGE UPDATE FUNCTIONS ------------------------------

function updateAirportsListOnPage(data) {

    let table = document.getElementById("list");
    table.innerHTML = '';

    for (let airport = 0; airport < data.length; airport++) {
        let airport_data = document.createElement("tr");
        airport_data.innerHTML = `<td>${data[airport].code}</td><td>${data[airport].country}</td><td>${data[airport].city}</td>`;
        table.appendChild(airport_data);
    }

}


function updatePlayerInfoOnPage(data) {

    document.getElementById("user-name").innerText = data.name;
    document.getElementById("distance").innerHTML = `<td>${data.distance_to_target} km</td>`;
    document.getElementById("co2").innerHTML = `<td>${data.co2_consumed} kg</td>`;

    let table = document.getElementById("current-location");
    let a_name = `<tr><td>Airport name:</td><td>${data.airport_name}</td></tr>`;
    let a_city = `<tr><td>City:</td><td>${data.airport_city}</td></tr>`;
    let a_country = `<tr><td>Country:</td><td>${data.airport_country}</td></tr>`;
    table.innerHTML = a_name + a_city + a_country;

}

// --------------------- EXPERIMENTS (NOT USED YET) ------------------------------

async function getCountryData(country_code) {
    const response = await fetch(`https://restcountries.com/v3.1/alpha/${country_code}`);
    if (!response.ok) throw new Error('Invalid server input!');
    const data = await response.json();
    console.log(data);
    let table = document.getElementById("current-country");
    let c_area = `<tr><td>Area:</td><td>${data[0].area} km<sup>2</sup></td></tr>`;
    let c_population = `<tr><td>Population:</td><td>${data[0].population}</td></tr>`;
    let c_flag = `<tr><td>Flag:</td><td><img src="${data[0].flags.png}" style="width: 100px"></td></tr>`;
    table.innerHTML = c_area + c_population + c_flag;
}

// ask the user if he wants to continue the prev game or start a new one
function promptContinueOrNewGame() {
    const dialog = document.getElementById("game-dialog");

    // Clear any existing content to avoid duplication
    dialog.innerHTML = ''; // Reset the dialog content

    dialog.innerHTML += '<div><p>You have an unfinished game.</p><p>Would you like to continue or start a new game?</p></div>';

    const btn_wrapper = document.createElement('div');
    btn_wrapper.classList.add('btn_wrapper');
    const new_game_btn = document.createElement('button');
    new_game_btn.innerText = 'New game';
    btn_wrapper.appendChild(new_game_btn);

    const continue_btn = document.createElement('button');
    continue_btn.innerText = 'Continue';
    btn_wrapper.appendChild(continue_btn);
    dialog.appendChild(btn_wrapper);

    dialog.showModal();
    // Event listener for "New game" button
    new_game_btn.addEventListener("click", () => {
        alert("Starting a new game");
        // Logic to start a new game
        dialog.close();
    });

    // Event listener for "Continue" button
    continue_btn.addEventListener("click", () => {
        alert("Continue the previous game");
        // Logic to continue the previous game
        dialog.close();
    });
}

function check_user_login() {
    const username = localStorage.getItem('userName');
    const password = localStorage.getItem('userPassword');
    if (!username || !password) {
        // Redirect user to another page
        window.location.href = 'login.html';
    }
}

// --------------------- RUN CODE ------------------------------
async function main() {
    check_user_login();
    const username = JSON.parse(localStorage.getItem('userName'));
    let player_data = await getPlayerData(username);
    if (player_data.new_user === false && player_data.game_completed === 0) {
        promptContinueOrNewGame();
    }
    let gameId = player_data.game_id;
    await gameSetup(gameId, username);
}

main();