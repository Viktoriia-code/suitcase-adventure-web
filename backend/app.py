import json
import os
import config

import mysql.connector
from dotenv import load_dotenv
from flask import Flask, request
from flask_cors import CORS
import random
from flask import jsonify
from geopy.distance import distance

from airport import Airport
import time

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

config.conn = connection

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

cursor = connection.cursor()


def fetch_random_large() -> list:
    """
    returns the list of airports, 5 from each continents ICAO-codes
    """
    continents = ["AF", "AS", "EU", "NA", "OC", "SA"]

    from_each_continent = config.airports_from_each_continent  # max 17 as just 17 airports in OC continent

    try:
        available_airports = []
        for _ in continents:
            with connection.cursor() as mycursor:
                sql = f""" 
                SELECT airport.ident FROM airport
                LEFT JOIN country
                ON airport.iso_country = country.iso_country
                WHERE airport.type = "large_airport"
                AND country.continent = "{_}";
                """

                mycursor.execute(sql)
                myresult = mycursor.fetchall()

                larges_from_continent = [i[0] for i in myresult]
                random.shuffle(larges_from_continent) # to random
                available_airports.extend(larges_from_continent[:from_each_continent])

        random.shuffle(available_airports)
        return available_airports

    except mysql.connector.Error as err:
        return []


def emission_calcs(distance_in_km: float) -> float:
    """
    :param distance_in_km:
    :return: CO2 emissions in kg (float)
    Calculate after each flight \n
    source1: https://ourworldindata.org/travel-carbon-footprint \n
    source2: https://www.statista.com/statistics/1185559/carbon-footprint-of-travel-per-kilometer-by-mode-of-transport/ \n
    source3: https://dbpedia.org/page/Flight_length
    """
    if distance_in_km < config.small_distance:
        return distance_in_km * config.coeff_small_distance
    elif config.small_distance <= distance_in_km < config.medium_distance:
        return distance_in_km * config.coeff_medium_distance
    else:
        return distance_in_km * config.coeff_big_distance


def distance_calcs(icao1: str, icao2: str) -> float:
    """
    returns the distance between two airports in kilometers (float number)
    """
    locations = [icao1, icao2]
    coordinates = []

    for _ in locations:

        sql = f""" 
        SELECT airport.latitude_deg, airport.longitude_deg
        FROM airport
        LEFT JOIN country 
        ON airport.iso_country = country.iso_country
        WHERE ident = "{_}";
        """

        mycursor = connection.cursor()
        mycursor.execute(sql)
        myresult = mycursor.fetchall()

        coordinates.append((myresult[0][0], myresult[0][1]))

    return distance(coordinates[0], coordinates[1]).km


@app.route('/creategame/<username>/<password>')
def create_game(username, password):
    """
    Creates a new game for the user. If the user has previous uncompleted game, the game is deleted.
    :param username:
    :param password:
    :return:
    """

    # Check if username and password are correct
    if not check_password(username, password):
        return "Wrong username or password.", 401

    # Delete the previous uncompleted game (or games) of the user if it exists
    cursor = connection.cursor()
    cursor.execute("DELETE FROM available_airport WHERE game_id IN (SELECT id FROM game WHERE player_id IN (SELECT id FROM player WHERE name = %s) AND completed = 0)", (username,))
    cursor.execute("DELETE FROM game WHERE player_id IN (SELECT id FROM player WHERE name = %s) AND completed = 0", (username,))
    cursor.reset()

    # Create id for the new game
    cursor.execute("SELECT MAX(id) FROM game")
    max_id_result = cursor.fetchone()
    max_id = max_id_result[0] if max_id_result[0] is not None else 0
    game_id = max_id + 1

    # Get list of the airports
    airports = fetch_random_large()

    # Get random current and target locations
    current_location = random.choice(airports)
    target_location = random.choice(airports)
    while current_location == target_location:
        target_location = random.choice(airports)

    distance_to_target = distance_calcs(current_location, target_location)
    flights_num = 0  # set flights_num as 0 at the beginning
    emissions = 0  # set emissions as 0 at the beginning

    # Create the new game
    insert_query = """
    INSERT INTO game (id, player_id, current_location, target_location, co2_consumed, flights_num, distance_to_target) 
    VALUES (%s, (SELECT id FROM player WHERE name = %s), %s, %s, %s, %s, %s)
    """
    cursor.execute(insert_query, (game_id, username, current_location, target_location, emissions, flights_num, distance_to_target))

    # new 30 rows in available_airport table for new game (game_id)
    for icao in airports:
        insert_query = """
        INSERT INTO available_airport (game_id, airport_ident) 
        VALUES (%s, %s)
        """

        cursor.execute(insert_query, (game_id, icao))

    cursor.close()

    return {"game": game_id}


def check_password(username: str, password: str) -> bool:
    """
    Checks if a user with the given username and password exists.
    :param username:
    :param password:
    :return:
    """

    cursor = connection.cursor()
    cursor.execute("SELECT * FROM player WHERE name = %s AND password = %s", (username, password))
    result = cursor.fetchone()

    return result is not None


@app.route('/users/<username>')
def fetch_player_data(username):
    try:
        player_location = f"""
            SELECT game.*, airport.name, airport.municipality, country.name, player.name
            FROM game 
            LEFT JOIN airport ON game.current_location = airport.ident
            LEFT JOIN country ON airport.iso_country = country.iso_country
            LEFT JOIN player ON game.player_id = player.id
            WHERE player.name = '{username}' AND game.completed = 0
        """
        cursor.execute(player_location)
        player_data = cursor.fetchone()

        if player_data is None:
            return {"new_user": True}

        player_data_json = {
            "game_id": player_data[0],
            "player_id": player_data[1],
            "current_location": player_data[2],
            "target_location": player_data[3],
            "co2_consumed": player_data[4],
            "flights_num": player_data[5],
            "distance_to_target": player_data[6],
            "game_completed": player_data[7],
            "airport_name": player_data[8],
            "airport_city": player_data[9],
            "airport_country": player_data[10],
            "name": player_data[11],
            "new_user": False,
        }
        return player_data_json
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/airports/<game_id>')
def fetch_game_airports(game_id):
    available_airports = []
    try:
        player_location = f"""
            SELECT available_airport.*, airport.name, airport.municipality, country.name, airport.latitude_deg, airport.longitude_deg 
            FROM available_airport 
            LEFT JOIN airport ON available_airport.airport_ident = airport.ident
            LEFT JOIN country ON airport.iso_country = country.iso_country
            WHERE game_id = '{game_id}'
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


@app.route('/flyto/<game_id>/<icao>')
def flyto(game_id, icao):
    cursor = connection.cursor()

    # Get the target location and distance to it from the database
    cursor.execute(f"SELECT target_location, distance_to_target FROM game WHERE id = {game_id}")
    target_location_result = cursor.fetchall()

    if len(target_location_result) != 1:
        print(f"Error while loading your target airport data.")
        return

    target_location = target_location_result[0][0]
    distance = target_location_result[0][1]

    emissions = emission_calcs(distance)

    current_location = icao

    distance = distance_calcs(current_location, target_location)

    # also "completed" fill updated!

    update_query = """
    UPDATE game 
    SET current_location = %s, target_location = %s, co2_consumed = co2_consumed + %s, flights_num = flights_num + %s, distance_to_target = %s, completed = %s 
    WHERE id = %s;"""
    cursor.execute(update_query, (current_location, target_location, emissions, 1, distance, current_location == target_location, game_id))

    return jsonify({"win": current_location == target_location})


@app.route('/airport/data/<icao>')
def get_airport_data(icao):
    airport = Airport(ident=icao)

    weather = airport.search_weather()
    wiki = airport.get_wikipedia_summary()
    local_time = airport.get_time()

    answer = {
            "name": airport.name,
            "weather": weather,
            "wiki": wiki,
            "time": local_time,
            "country_code": airport.country_code.lower()
        }

    return jsonify(answer)


@app.route('/users/<username>/<password>')
def login_user(username, password):
    sql = "SELECT * FROM player WHERE name=%s AND password=%s"
    val = (username, password)

    cursor.reset()
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


@app.route('/register/<username>/<password>')
def register_user(username, password):
    """
    register new user
    """
    # Check if username length is valid
    if len(username) < 3 or len(username) > 20:
        return "Username is too short or long. Try again.", 400

    # Check if username already exists
    cursor = connection.cursor()
    cursor.execute("SELECT name FROM player WHERE name = %s", (username,))
    if cursor.fetchone() is not None:
        cursor.close()
        return "Username already exists. Try again.", 400
    cursor.reset()

    # Check if password length is valid
    if len(password) < 4 or len(password) > 50:
        cursor.close()
        return "Password is too short or long. Try again.", 400

    # Find the maximum id value currently in use
    cursor.execute("SELECT MAX(id) FROM player")
    max_id_result = cursor.fetchone()
    max_id = max_id_result[0] if max_id_result[0] is not None else 0
    new_id = max_id + 1
    cursor.reset()

    # Insert the airport into the MySQL database with a new id
    insert_query = "INSERT INTO player (id, name, password) VALUES (%s, %s, %s)"
    cursor.execute(insert_query, (new_id, username, password))
    cursor.close()

    # Check that login can be done successfully after creating the user and return the login result
    return login_user(username, password)


if __name__ == '__main__':
    app.run(use_reloader=True, host='127.0.0.1', port=5000)
