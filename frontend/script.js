'use strict';

// --------------------- MAP ------------------------------

const map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

const bagIcon = L.icon({
    iconUrl: 'assets/markers/travel-bag.png',
    iconSize: [35, 35],
});

const airportIcon = L.icon({
    iconUrl: 'assets/markers/airport7.png',
    iconSize: [40, 40],
});

// --------------------- GLOBAL VARIABLES ------------------------------

const apiUrl = 'http://127.0.0.1:5000';
const airportMarkers = L.featureGroup().addTo(map);
let gifCount = 0;

// -------- music & sounds global settings ------------

let music = true;
let sounds = true;

const song = new Audio('assets/music/music3.mp3');
song.volume = 0.5;
music && song.play();

// endless song loop
song.addEventListener('ended', () => {
    song.currentTime = 0;
    song.play();
});

// --------------------- MAIN LOOP ------------------------------

// main loop, based on buttons on the map
// after each click (other words - after choosing the airport where to fly), the entire page is updated to make it easier to track the moment when the player reaches the goal 

async function gameSetup(gameID, username, password) {
    try {
        showLoader();

        const gameInfo = await getGameData(gameID);
        const airportsList = await getAirportList(gameID);
        const airportData = await getAirportData(gameInfo.current_location);

        updatePlayerInfoOnPage(gameInfo);
        updateDynamicData(airportData);

        hideLoader();

        // stamps check
        playerStampsUpdateAndShow(gameInfo.airport_country);
      
        airportMarkers.clearLayers();

        // win case
        if (gameInfo.target_location === gameInfo.current_location) {
            user_wins(gameInfo, username, password);
        }

        // Plot markers on the map
        airportsList.forEach(airport => {
            var marker = L.marker([airport.lat, airport.long]).addTo(map);
            airportMarkers.addLayer(marker);

            if (airport.code === gameInfo.current_location) {

                map.setView([airport.lat, airport.long], 2);

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
                marker.setIcon(bagIcon);
            } else {
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

                marker.setIcon(airportIcon);

                // very important - here we can later trace if the goal is reached
                goButton.addEventListener('click', async function () {
                    // sound for 2-3 sec fly
                    let flySound = new Audio('assets/sounds/fly3.wav');
                    flySound.volume = 0.5;
                    flySound.currentTime = 1.3;
                    sounds && flySound.play();

                    const result = await updatePlayerLocation(gameID, airport.code); // returns True if the same locations, or False if not

                    await gameSetup(gameID, username, password);
                });
            }
        });
    } catch (error) {
        console.log(error);
    }
}

// --------------------- API GET FUNCTIONS ------------------------------

// Sends request to the given URL and parses the response as JSON.
async function getJsonData(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Invalid server input!');
    const data = await response.json();

    return data;
}

// returns all data from "available_airport" table in SQL
async function getAirportList(gameId) {
    return await getJsonData(`${apiUrl}/airports/${gameId}`);
}

// returns data about the current game id of the player
async function getPlayerGame(username) {
    return await getJsonData(`${apiUrl}/gameid/${username}`);
}

// returns data about the game
async function getGameData(gameId) {
    return await getJsonData(`${apiUrl}/gamedata/${gameId}`);
}

// returns "true" if players wins or "false" if not
async function updatePlayerLocation(gameId, icao) {
    return await getJsonData(`${apiUrl}/flyto/${gameId}/${icao}`);
}

// returns JSON with data for search airport
async function getAirportData(icao) {
    return await getJsonData(`${apiUrl}/airport/data/${icao}`);
}


async function getAllStamps() {
    return await getJsonData(`${apiUrl}/stamps`);
}


// returns json with true or false
async function checkPlayerStamps(playerName, stampName) {
    return await getJsonData(`${apiUrl}/stamps/${playerName}/${stampName}`)
}

// --------------------- WEB PAGE UPDATE FUNCTIONS ------------------------------
function updatePlayerInfoOnPage(data) {

    document.getElementById("distance").innerHTML = `<td>${data.distance_to_target.toLocaleString()} km</td>`;
    document.getElementById("co2").innerHTML = `<td>${data.co2_consumed.toLocaleString()} kg</td>`;

    let table = document.getElementById("current-location");
    table.innerHTML = '';

    let a_name = `<tr><td>Airport name:</td><td>${data.airport_name}</td></tr>`;
    let a_city = `<tr><td>City:</td><td>${data.airport_city}</td></tr>`;

    let a_country = `
    <tr>
        <td>Country:</td>
        <td id="country_name">${data.airport_country}</td>
    </tr>`;

    table.innerHTML += a_name + a_city + a_country;

}

function addSoundsToButtons() {
    const soundButtons = document.getElementsByClassName("sound-btn");
    const musicButtons = document.getElementsByClassName("music-btn");
    const musicDiv = document.getElementById("music");
    const soundsButton = document.getElementById("sounds");
    const volumeControl = document.getElementById("volume");

    for (let btn of musicButtons) {
        btn.addEventListener("click", (evt) => {
            music = !music
            if (music) {
                musicDiv.querySelector("p").innerHTML = "Music 🟢"
                song.play();
            }
            else {
                musicDiv.querySelector("p").innerHTML = "Music 🔴"
                song.pause();
            }
        });
    }

    volumeControl.addEventListener("change", (evt) => {
        music = true;
        song.play();
        song.volume = evt.target.value / 100;

        if (evt.target.value == 0) {
            musicDiv.querySelector("p").innerHTML = "Music 🔴";
        }
        else {
            musicDiv.querySelector("p").innerHTML = "Music 🟢";
        }


    });
    

    soundsButton.addEventListener("click", (evt) => {
        sounds = !sounds
        if (sounds) {
            soundsButton.querySelector("p").innerHTML = "Sounds 🟢"
        }
        else {
            soundsButton.querySelector("p").innerHTML = "Sounds 🔴"
        }
    });

    for (let btn of soundButtons) {
        btn.addEventListener("click", (evt) => {
            let clickSound = new Audio('assets/sounds/click.wav');
            clickSound.volume = 0.3;

            sounds && clickSound.play(); 

        });
    }

}

function updateDynamicData(data) {

    let countryNameElement = document.getElementById("country_name");
    countryNameElement.innerHTML += `<img class="flag" src="assets/flags/${data.country_code}.png" alt="flag">`

    let table = document.getElementById("current-location");

    let a_time = `
    <tr>
        <td>
            Local Time:
        </td>
        <td>
            ${data.time}
        </td>
    </tr>`;

    let a_weather = `
    <tr>
        <td>
            Weather:
        </td>
        <td>
            <span>${data.weather.temp.toFixed()}°C</span>
            <img src="${data.weather.icon}" alt="Weather Icon" title="${data.weather.description}">
        </td>
    </tr>`;

    document.getElementById("wikipedia").innerHTML = `<td>${data.wiki.text}</td>`;
    document.getElementById("wiki-link").href = data.wiki.source;

    table.innerHTML += a_time + a_weather;

}

function promptNewStamp(stamp) {
    const dialog = document.getElementById("new-stamp-modal");
    const newStampImg = document.getElementById("new-stamp-img");
    const newStampBtn = document.getElementById("new-stamp-btn");
    const newStampDesc = document.getElementById("new-stamp-description");

    newStampImg.src = `assets/stamps/${stamp.img}`;
    newStampDesc.innerHTML = `${stamp.name} <a style="text-decoration:none" href="${stamp.source}">🔗</a>`;   

    dialog.showModal();

    newStampBtn.addEventListener("click", () => {
        dialog.close();
    });
}

async function playerStampsUpdateAndShow(countryName) {
    const stamps = await getAllStamps();
    const current_country = countryName;
    const player_name = localStorage.getItem('userName');

    if (stamps[current_country]) {
        const stampResponse = await checkPlayerStamps(player_name, countryName);
        if (!stampResponse.already_collected) {
            promptNewStamp(stamps[current_country]);
        }
    }
}

// --------------------- WEB PAGE UPDATE FUNCTIONS -- LOADER ------------------------------

function showLoader() {

    const mapElement = document.getElementById("map");
    const loaderElement = document.getElementById("loader");
    const gameData = document.querySelector(".game-data");
    const gameDataLoad = document.querySelector(".loading-game-data");

    gifCount++;
    if (gifCount > 4) {
        gifCount = 1;
    }

    loaderElement.style.backgroundImage = `url('assets/fly/fly${gifCount}.gif')`

    mapElement.style.display = "none";
    loaderElement.style.display = "block";

    gameData.style.display="none"
    gameDataLoad.style.display="block"

}

function hideLoader() {

    const mapElement = document.getElementById("map");
    const loaderElement = document.getElementById("loader");
    const gameData = document.querySelector(".game-data");
    const gameDataLoad = document.querySelector(".loading-game-data");

    loaderElement.style.display = "none";
    mapElement.style.display = "block";

    gameData.style.display="block"
    gameDataLoad.style.display="none"

}

// ask the user if he wants to continue the prev game or start a new one
function promptContinueOrNewGame(previousGameId, username, password) {
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
    new_game_btn.addEventListener("click", async () => {

        const gameId = await createGame(username, password);
        if (gameId === null) {
            return;
        }

        await gameSetup(gameId, username, password)

        dialog.close();
    });

    // Event listener for "Continue" button
    continue_btn.addEventListener("click", () => {
        gameSetup(previousGameId, username, password)

        dialog.close();
    });

    dialog.addEventListener('cancel', (event) => {
        event.preventDefault();
    });
}

async function createGame(username, password) {
    try {
        const response = await fetch(`${apiUrl}/creategame/${username}/${password}`);
        if (!response.ok) {
            const responseText = await response.text();

            alert('Server error:\n' + responseText)
            console.error('Server error: ' + responseText);

            return null;
        }

        const json = await response.json();
        return json.game;

    } catch (error) {
        alert('Server connection failed: ' + error.message)
        console.error('Server connection failed: ' + error.message);
    }

    return null;
}

function check_user_login() {
    const username = localStorage.getItem('userName');
    const password = localStorage.getItem('userPassword');
    if (!username || !password) {
        // Redirect user to another page
        window.location.href = 'login.html';
    }
}

function user_wins(playerInfo, username, password) {
    const dialog = document.getElementById("game-dialog");
    dialog.innerHTML = ''; // Reset the dialog content
    dialog.innerHTML += `<h2>Congratulations, you found the owner! 🎉</h2>`;
    dialog.innerHTML += '<h3>Game results:</h3>';
    dialog.innerHTML += `<p>✈️ Number of flights taken: ${playerInfo.flights_num}</p>`;
    dialog.innerHTML += `<p>🌿 CO2 emissions caused by the player: ${playerInfo.co2_consumed} kg</p>`;

    if (playerInfo.co2_consumed >= 1400) {
        dialog.innerHTML += `<p>🚗 Your emitting is roughly equivalent to the weight of about ${Math.round(playerInfo.co2_consumed / 1400)} standard cars.</p>`;
    } else {
        dialog.innerHTML += `<p>🚲 Your emitting is roughly equivalent to the weight of about ${Math.round(playerInfo.co2_consumed / 15)} standard bicycles.</p>`;
    }
    dialog.innerHTML += '<h2>🌍 Choose your trips mindfully, for a greener tomorrow. 💚</h2>';

    dialog.innerHTML += '<p>Would you like to start a new game or exit?</p>';

    const btn_wrapper = document.createElement('div');
    btn_wrapper.classList.add('btn_wrapper');

    const exit_btn = document.createElement('button');
    exit_btn.innerText = 'Exit';
    btn_wrapper.appendChild(exit_btn);

    const new_game_btn = document.createElement('button');
    new_game_btn.innerText = 'New game';
    btn_wrapper.appendChild(new_game_btn);
    dialog.appendChild(btn_wrapper);

    dialog.showModal();
    // Event listener for "New game" button
    new_game_btn.addEventListener("click", async () => {

        const gameId = await createGame(username, password);
        if (gameId === null) {
            return;
        }

        await gameSetup(gameId, username, password)

        dialog.close();
    });

    // Event listener for "Exit" button
    exit_btn.addEventListener("click", () => {
        dialog.close();
        // Delete data from localStorage
        localStorage.removeItem('userName');
        localStorage.removeItem('userPassword');

        // Redirect user to another page
        window.location.href = 'login.html';
    });
}

// --------------------- RUN CODE ------------------------------
async function main() {
    check_user_login();

    const username = JSON.parse(localStorage.getItem('userName'));
    const password = JSON.parse(localStorage.getItem('userPassword'));

    document.getElementById("user-name").innerText = username;

    addSoundsToButtons();

    let gameData = await getPlayerGame(username);

    if (!gameData.exists) {
        const gameId = await createGame(username, password);
        if (gameId === null) {
            return;
        }

        await gameSetup(gameId, username, password);

        return;
    }
  
    promptContinueOrNewGame(gameData.game_id, username, password);
}

main();
