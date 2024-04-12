'use strict';

async function getAirportList() {
  let ul = document.getElementById("list");
  ul.innerHTML = '';
  const response = await fetch(`http://127.0.0.1:5000/airport/random_large`);
  const jsonResponse = await response.json();

  for (let airport = 0; airport < jsonResponse.length; airport++) {
    let li = document.createElement("li");
    li.innerHTML = jsonResponse[airport];
    ul.appendChild(li);
  }
}