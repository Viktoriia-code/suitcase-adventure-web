import json
import os

import mysql.connector
from dotenv import load_dotenv
from flask import Flask, request
from flask_cors import CORS
import random
from flask import jsonify
from geopy.distance import distance

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


def fetch_random_large() -> list:
    """
    returns the list of airports, 5 from each continent' ICAO-codes
    """
    continents = ["AF", "AS", "EU", "NA", "OC", "SA"]

    from_each_continent = 5  # max 17 as just 17 airports in OC continent

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
    if distance_in_km < 1100:
        return distance_in_km * 0.245
    elif 1100 <= distance_in_km < 2000:
        return distance_in_km * 0.151
    else:
        return distance_in_km * 0.148


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


@app.route('/status/<game_id>')
def fetch_player_data(game_id):
    try:
        player_location = f"""
            SELECT game.*, airport.name, airport.municipality, country.name, player.name
            FROM game 
            LEFT JOIN airport ON game.current_location = airport.ident
            LEFT JOIN country ON airport.iso_country = country.iso_country
            LEFT JOIN player ON game.player_id = player.id
            WHERE game.id = '{game_id}'
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
