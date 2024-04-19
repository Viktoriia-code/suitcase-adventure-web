// show the map
const map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// Load JSON data and plot markers on the
fetch('http://127.0.0.1:5000/user/game/airport')
    .then(response => response.json())
    .then(data => {
        // Plot markers on the map
        data.forEach(item => {
            var marker = L.marker([item.lat, item.long]).addTo(map);
            // Customize marker popup
            var popupContent = item.name + "<br>" + item.city + " (" + item.country + ")";
            marker.bindPopup(popupContent);
        });
    });