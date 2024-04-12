import mysql.connector
from flask import Flask
import os
from dotenv import load_dotenv
import random

from flask_cors import CORS

load_dotenv()

connection = mysql.connector.connect(
         host='127.0.0.1',
         port=3306,
         database='flight_game',
         user='root',
         password=os.getenv('DB_PASSWORD'),
         autocommit=True
        )

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

@app.route('/airport/random_large')
def fetch_random_large():
    continents = ["AF", "AS", "EU", "NA", "OC", "SA"]
    from_each_continent = 5
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
                random.shuffle(larges_from_continent)  # to random
                available_airports.extend(larges_from_continent[:from_each_continent])

        random.shuffle(available_airports)
        return available_airports
    except:
        return "The airport search could not be performed."


if __name__ == '__main__':
    app.run(use_reloader=True, host='127.0.0.1', port=5000)
