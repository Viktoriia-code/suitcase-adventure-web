'use strict';

function getAirportList() {
  fetch(`http://127.0.0.1:5000/user/game/airport`)
    .then(response => response.json())
    .then(data => {
      console.log(data);
      let table = document.getElementById("list");
      table.innerHTML = '';

      for (let airport = 0; airport < data.length; airport++) {
        let airport_data = document.createElement("tr");
        airport_data.innerHTML = `<td>${data[airport].code}</td><td>${data[airport].country}</td><td>${data[airport].city}</td>`;
        table.appendChild(airport_data);
      }
    })
}

function getPlayerData() {
  fetch(`http://127.0.0.1:5000/user/data`)
    .then(response => response.json())
    .then(data => {
      console.log(data);
      document.getElementById("user-name").innerText = data.name;
      document.getElementById("distance").innerHTML = `<td>${data.distance_to_target} km</td>`;
      document.getElementById("co2").innerHTML = `<td>${data.co2_consumed} kg</td>`;

      let table = document.getElementById("current-location");
      let a_name = `<tr><td>Airport name:</td><td>${data.airport_name}</td></tr>`;
      let a_city = `<tr><td>City:</td><td>${data.airport_city}</td></tr>`;
      let a_country = `<tr><td>Country:</td><td>${data.airport_country}</td></tr>`;
      table.innerHTML = a_name + a_city + a_country;
    })
}

getAirportList();
getPlayerData();
