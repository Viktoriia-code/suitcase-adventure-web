import requests
import json
import csv

from datetime import datetime
import pytz
from timezonefinder import TimezoneFinder


import config
import mysql.connector

import os

from dotenv import load_dotenv
load_dotenv()


class Airport:
    def __init__(self, ident):
        self.ident = ident

        try:
            with config.conn.cursor():
                sql = f"""
                SELECT ident, name, latitude_deg, longitude_deg, iso_country, iata_code FROM airport 
                WHERE ident='{ident}'"""

                mycursor = config.conn.cursor()
                mycursor.execute(sql)
                myresult = mycursor.fetchall()
                print(myresult)
                if len(myresult) == 1:
                    self.name = myresult[0][1]
                    self.latitude = float(myresult[0][2])
                    self.longitude = float(myresult[0][3])
                    self.country_code = myresult[0][4]
                    self.iata_code = myresult[0][5]

        except mysql.connector.Error as err:
            print(err)

    def search_weather(self) -> dict:
        apikey = os.getenv('WEATHER_API_KEY')

        params = {
            "lat": self.latitude,
            "lon": self.longitude,
            "appid": apikey,
            "units": "metric"
        }

        url = "https://api.openweathermap.org/data/2.5/weather"

        answer = requests.get(url=url, params=params)
        data = answer.json()

        return {
            "main": data["weather"][0]["main"],
            "description": data["weather"][0]["description"],
            "icon": f"https://openweathermap.org/img/wn/{data["weather"][0]["icon"]}@2x.png",
            "temp": data["main"]["temp"]
        }

    def get_wikipedia_summary(self):
        f = open('airports_wikipedia.json')
        data = json.load(f)

        return data[self.ident]


    def get_time(self):

        found_from_csv = False

        with open('timezones.csv', mode='r') as file:
            csvFile = csv.reader(file)
            for lines in csvFile:
                if self.iata_code in lines:
                    tz = lines[1]
                    found_from_csv = True

        if not found_from_csv:
            obj = TimezoneFinder()
            tz = obj.timezone_at(lng=self.longitude, lat=self.latitude)

        local = pytz.timezone(tz)
        datetime_local = datetime.now(local)

        utc_offset = datetime_local.utcoffset()
        utc_offset_str = '{:+03d}:{:02d}'.format(utc_offset.days * 24 + utc_offset.seconds // 3600,
                                                 utc_offset.seconds % 3600 // 60)

        return datetime_local.strftime('%H:%M') + " (UTC" + utc_offset_str + ")"


