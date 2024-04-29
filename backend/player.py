import config
import mysql.connector


class Player:
    def __init__(self, player_name):
        self.player_name = player_name.replace('"', '')
        self.stamps = []

        try:
            with config.conn.cursor():
                sql = f"""
                SELECT stamp FROM player_stamps 
                WHERE player_stamps.player_name = '{self.player_name}'"""

                mycursor = config.conn.cursor()
                mycursor.execute(sql)
                myresult = mycursor.fetchall()

                for result in myresult:
                    self.stamps.append(result[0])

        except mysql.connector.Error as err:
            print(err)

    def add_stamp(self, stamp_name):
        self.stamps.append(stamp_name)
        try:
            with config.conn.cursor():
                sql = f"""
                INSERT INTO player_stamps
                VALUES ("{self.player_name}", "{stamp_name}");"""

                mycursor = config.conn.cursor()
                mycursor.execute(sql)

        except mysql.connector.Error as err:
            print(err)