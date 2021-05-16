import requests
import lxml.html as lh
import pandas as pd
import json
from datetime import datetime
import calendar

play_off_keys = {
    57: 'Qualifier 1',
    58: 'Eliminator',
    59: 'Qualifier 2',
    60: 'Final'
}

url = 'https://timesofindia.indiatimes.com/sports/cricket/ipl/top-stories/ipl-2021-schedule-full-time-table-fixtures-list-dates-and-venues-of-indian-premier-league/articleshow/81924982.cms'

page = requests.get(url)

doc = lh.fromstring(page.content)

tr_elements = doc.xpath('//tr')

# To
# print([len(T) for T in tr_elements[::]])

jsonObj = {}

i = 0
for row in tr_elements[1::]:
    i += 1
    matchObj = {}

    date_info = str(row[0].text_content()).split(' ')
    teams = str(row[1].text_content()).split(' vs ')
    time_info = str(row[2].text_content())

    year = 2021
    month = list(calendar.month_name).index(date_info[0])
    day = int(date_info[1])
    hours = int(time_info.split(':')[0]) + 12 if time_info[-2:] == 'pm' else int(time_info.split(':')[0])
    minutes = int(time_info.split(':')[1][:-3])

    match_date_time = datetime(year, month, day, hours, minutes).strftime("%d-%m-%Y %H:%M")

    if i <= 56:
        jsonObj[str(i)] = {
            't1': teams[0],
            't2': teams[1],
            'time': str(match_date_time)
        }
    else:
        jsonObj[play_off_keys[i]] = {
            't1': 'TBD',
            't2': 'TBD',
            'time': str(match_date_time)
        }

print(json.dumps(jsonObj, separators=(',', ':')))

