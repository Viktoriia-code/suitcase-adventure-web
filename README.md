# 🎒 Suitcase Adventure (Web Version) 🌍

Embark on a journey like no other as you explore the world while learning about the impact of your travels on the environment! 🌱✈️

📅 March - May, 2024

## :video_game: About the game
Suitcase Adventure is a web-based game that blends entertainment with environmental education.

Players explore global destinations, aiming to reduce their carbon footprint while receiving feedback on their travel emissions. The frontend offers an interactive map, colorful graphics, and user-friendly navigation, while the backend handles user data, airports, flights, and carbon footprint calculations.

The game challenges players to make eco-friendly travel choices, providing educational tips and encouraging strategic decisions to minimize environmental impact.

<p align="center">
  <img src="https://github.com/Viktoriia-code/suitcase-adventure-web/assets/43078402/9da5d26f-737e-4c68-92fa-2b29153d1c91" alt="image" width="800">
</p>

## :floppy_disk: Technical stack overview
* Frontend: HTML, CSS, JavaScript
* Backend: Python, Flask
* Database: SQL
* 3rd party API: [Open Weather API](https://openweathermap.org/api)

## :electric_plug: Modules
* Flask
* Flask-Cors
* geopy
* mysql-connector-python
* python-dotenv
* pytz
* requests
* timezonefinder
* wikipedia

## :wrench: Install the required Python packages using pip:
Navigate to the folder backend:
```
cd backend
```
and use the command:
```
pip install -r requirements.txt
```

## :closed_lock_with_key: ENV file:
Create at the main folder file with name ".env". Add your database password (DB_PASSWORD), OpenWeatherMap API key (WEATHER_API_KEY), host and port to the file.
<p align="center">
  <img src="https://github.com/Viktoriia-code/suitcase-adventure-web/assets/43078402/b295b03b-d839-4c13-86d7-5f2f35f70b22" alt="image" width="600">
</p>

```
DB_PASSWORD=''
DB_HOST=''
DB_PORT=''
DB_NAME=''
DB_USER=''
WEATHER_API_KEY=''
```
