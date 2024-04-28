import requests
from typing import Optional
import wikipedia
import re
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
            "icon": f"https://openweathermap.org/img/wn/{data['weather'][0]['icon']}@2x.png",
            "temp": data["main"]["temp"]
        }

    def get_wikipedia_summary(self) -> Optional[dict]:
        """
        Searches the given airport name from Wikipedia and returns a short summary of the airport.
        If the airport article is not found or getting data from Wikipedia fails, the function returns None.
        :param airport_name:
        :return:
        """

        # Generate the Wikipedia search query
        if len(self.name) == 40:
            airport_name_words = self.name.split(" ")
            if len(airport_name_words) > 1:
                airport_name_words.pop(-1)
            search_query = " ".join(airport_name_words)
        else:
            search_query = self.name

        # Search the search query from Wikipedia and get the summary and url of the article
        # Return None if getting data from Wikipedia failed
        try:
            wikipedia_article = wikipedia.page(search_query)
            summary = re.sub(" +", " ",
                             re.sub("\\.([a-zA-Z])", ". \\1", wikipedia_article.summary.replace("\n", " ")))
            url = wikipedia_article.url
        except wikipedia.exceptions.WikipediaException:
            # just in case if Wiki doesn't work, but we want to return smth
            return {
                "text": f"Find more data about {self.name} from <a id='airport-guide-link' href='https://airportguide.com/airport/info/{self.iata_code}'>Airport Guide</a>",
                "source": f"https://airportguide.com/airport/info/{self.iata_code}"
            }

        # Get the first 3 sentences of the summary
        sentences = summary.split(". ")
        first_sentences = ". ".join(sentences[:min(len(sentences), 3)])
        if not first_sentences.endswith("."):
            first_sentences += "."

        # Construct the summary text from the list of words with new line every 20 words
        summary_words = first_sentences.split(" ")
        summary_with_line_breaks = ""
        for i in range(len(summary_words)):
            if (i + 1) % 20 == 0:
                summary_with_line_breaks += "\n"
            summary_with_line_breaks += f"{summary_words[i]} "

        return {
            "text": summary_with_line_breaks,
            "source": url
        }

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

    def get_country_info(self):

        url = f"https://restcountries.com/v3.1/alpha/{self.country_code}"

        answer = requests.get(url=url)
        data = answer.json()

        return {
            "area": data[0]["area"],
            "population": data[0]["population"],
            "flag": data[0]["flags"]["png"]
        }

    def get_data(self):
        return {
            "name": self.name,
            "weather": self.search_weather(),
            "wiki": self.get_wikipedia_summary(),
            "time": self.get_time(),
            "country": self.get_country_info()
        }
