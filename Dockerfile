FROM node:boron

RUN apt-get update \
    && apt-get install -y git sqlite3

# make directory
RUN mkdir /hackadoc
WORKDIR /hackadoc

ADD package*.json ./
# npm install
RUN npm install

# file moving
ADD . .
# rename examples
RUN mv .sequelizerc.example .sequelizerc
RUN mv config.json.example config.json

# npm build
RUN npm run build

# npm dev dependencies
RUN npm prune --production

# remove build dependencies
RUN apt-get remove -y --auto-remove build-essential && \
        apt-get clean && apt-get purge && rm -r /var/lib/apt/lists/*

EXPOSE 3000

CMD ["node", "app.js"]
