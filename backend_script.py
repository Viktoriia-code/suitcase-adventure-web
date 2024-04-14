import json
import os

import mysql.connector
from dotenv import load_dotenv
from flask import Flask, request
from flask_cors import CORS
import random
from flask import jsonify

load_dotenv()

app = Flask(__name__)

cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

connection = mysql.connector.connect(
         host='127.0.0.1',
         port=3306,
         database='suitcase_game',
         user='root',
         password=os.getenv('DB_PASSWORD'),
         autocommit=True
        )

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

cursor = connection.cursor()

@app.route('/airport/random_large')
def fetch_random_large():
    continents = ["AF", "AS", "EU", "NA", "OC", "SA"]
    from_each_continent = 5

    available_airports = []
    for continent in continents:
        sql = f"""
                SELECT airport.ident, airport.name, airport.municipality, country.name, airport.latitude_deg, airport.longitude_deg FROM airport
                LEFT JOIN country
                ON airport.iso_country = country.iso_country
                WHERE airport.type = "large_airport"
                AND country.continent = "{continent}"
        """
        cursor.execute(sql)
        myresult = cursor.fetchall()
        random.shuffle(myresult)
        for index in range(from_each_continent):
            airport_json = {
                "ICAO": myresult[index][0],
                "airport_name": myresult[index][1],
                "airport_city": myresult[index][2],
                "country": myresult[index][3],
                "lat": myresult[index][4],
                "long": myresult[index][5],
            }
            available_airports.append(airport_json)
        #random.shuffle(available_airports)
    return jsonify(available_airports)

@app.route('/user/data')
def fetch_player_data():
    game_id = 109
    try:
        player_location = f"""
            SELECT game.*, airport.name, airport.municipality, country.name, player.name
            FROM game 
            LEFT JOIN airport ON game.current_location = airport.ident
            LEFT JOIN country ON airport.iso_country = country.iso_country
            LEFT JOIN player ON game.player_id = player.id
            WHERE game.id = '109'
        """
        cursor.execute(player_location)
        player_data = cursor.fetchone()
        print(player_data)

        player_data_json = {
            "player_id": player_data[1],
            "current_location": player_data[2],
            "target_location": player_data[3],
            "co2_consumed": player_data[4],
            "flights_num": player_data[5],
            "distance_to_target": player_data[6],
            "airport_name": player_data[8],
            "airport_city": player_data[9],
            "airport_country": player_data[10],
            "name": player_data[11],
        }
        return player_data_json
    except Exception as e:
        return str(e)

@app.route('/user/game/airport')
def fetch_game_airports():
    game_id = 109
    available_airports = []
    try:
        player_location = f"""
            SELECT available_airport.*, airport.name, airport.municipality, country.name, airport.latitude_deg, airport.longitude_deg 
            FROM available_airport 
            LEFT JOIN airport ON available_airport.airport_ident = airport.ident
            LEFT JOIN country ON airport.iso_country = country.iso_country
            WHERE game_id = '109'
        """
        cursor.execute(player_location)
        player_data = cursor.fetchall()
        for airport in player_data:
            airport_data_json = {
                "code": airport[1],
                "name": airport[2],
                "city": airport[3],
                "country": airport[4],
                "lat": airport[5],
                "long": airport[6],
            }
            available_airports.append(airport_data_json)
        #print(available_airports)
        return available_airports
    except Exception as e:
        return str(e)

@app.route('/users/<username>/<password>')
def login_user(username, password):
    sql = "SELECT * FROM player WHERE name=%s AND password=%s"
    val = (username, password)

    cursor.execute(sql, val)
    result = cursor.fetchone()

    if result:
        user_json = {
            "username": result[1],
            "password": result[2],
        }
        return user_json
    else:
        return "Sorry, wrong username or password. Try again.", 401


if __name__ == '__main__':
    app.run(use_reloader=True, host='127.0.0.1', port=5000)
