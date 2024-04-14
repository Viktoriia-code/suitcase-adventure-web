'use strict';

async function getAirportList() {
    const response = await fetch(`http://127.0.0.1:5000/user/game/airport`);
    if (!response.ok) throw new Error('Invalid server input!');
    const data = await response.json();

    console.log(data);
    let table = document.getElementById("list");
    table.innerHTML = '';

    for (let airport = 0; airport < data.length; airport++) {
        let airport_data = document.createElement("tr");
        airport_data.innerHTML = `<td>${data[airport].code}</td><td>${data[airport].country}</td><td>${data[airport].city}</td>`;
        table.appendChild(airport_data);
    }
}

async function getPlayerData() {
    const response = await fetch(`http://127.0.0.1:5000/user/data`);
    if (!response.ok) throw new Error('Invalid server input!');
    const data = await response.json();

    console.log(data);
    document.getElementById("user-name").innerText = data.name;
    document.getElementById("distance").innerHTML = `<td>${data.distance_to_target} km</td>`;
    document.getElementById("co2").innerHTML = `<td>${data.co2_consumed} kg</td>`;

    let table = document.getElementById("current-location");
    let a_name = `<tr><td>Airport name:</td><td>${data.airport_name}</td></tr>`;
    let a_city = `<tr><td>City:</td><td>${data.airport_city}</td></tr>`;
    let a_country = `<tr><td>Country:</td><td>${data.airport_country}</td></tr>`;
    table.innerHTML = a_name + a_city + a_country;
}

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

//getAirportList();
async function main() {
    await getAirportList();
    await getPlayerData();
    //await getCountryData("RU");
}

main();