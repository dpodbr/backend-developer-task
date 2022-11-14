FROM mongo:latest

COPY users.json /users.json
COPY notes.json /notes.json

CMD mongoimport --host mongodb --username=${DB_USERNAME} --password=${DB_PASSWORD} --authenticationDatabase admin --db notes --collection notes --drop --file /notes.json --jsonArray && mongoimport --host mongodb --username=${DB_USERNAME} --password=${DB_PASSWORD} --authenticationDatabase admin --db notes --collection users --drop --file /users.json --jsonArray
