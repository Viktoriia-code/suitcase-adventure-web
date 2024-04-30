import json
import wikipedia
import re
import mysql.connector
from dotenv import load_dotenv
import os

load_dotenv()


def get_wikipedia_summary(name, iata_code):
    """
    Searches the given airport name from Wikipedia and returns a short summary of the airport.
    If the airport article is not found or getting data from Wikipedia fails, the function returns None.
    :param airport_name:
    :return:
    """

    # Generate the Wikipedia search query
    if len(name) == 40:
        airport_name_words = name.split(" ")
        if len(airport_name_words) > 1:
            airport_name_words.pop(-1)
        search_query = " ".join(airport_name_words)
    else:
        search_query = name

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
            "text": f"Find more data about {name} from <a id='airport-guide-link' href='https://airportguide.com/airport/info/{iata_code}'>Airport Guide</a>",
            "source": f"https://airportguide.com/airport/info/{iata_code}"
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


def json_output():
    output_dict = {}

    connection = mysql.connector.connect(
             host='127.0.0.1',
             port=3306,
             database='suitcase_game',
             user='root',
             password=os.getenv('DB_PASSWORD'),
             autocommit=True
            )

    with connection.cursor():
        sql = f"""
        SELECT airport.ident, airport.name, airport.iata_code FROM airport
        WHERE airport.`type` = "large_airport";"""

        mycursor = connection.cursor()
        mycursor.execute(sql)
        myresult = mycursor.fetchall()

        i = 0
        for result in myresult:
            i += 1

            ident = result[0]
            name = result[1]
            code = result[2]

            output_dict[ident] = get_wikipedia_summary(name, code)

            print(i)
            # if i == 3:
            #     break

        json_object = json.dumps(output_dict, indent=4)

        with open("airports_wikipedia.json", "w") as outfile:
            outfile.write(json_object)

# json_output()