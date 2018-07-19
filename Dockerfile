FROM node:boron

ENV DOCKERIZE_VERSION v0.3.0

 RUN echo "deb http://apt.postgresql.org/pub/repos/apt/ wheezy-pgdg main" > /etc/apt/sources.list.d/pgdg.list && \
	wget -O - http://apt.postgresql.org/pub/repos/apt/ACCC4CF8.asc | apt-key add - && \
	apt-get update && \
	apt-get install -y git postgresql-client-9.6 && \

#make directory
RUN mkdir /hackadoc
WORKDIR /hackadoc

# file moving
ADD . .
# rename examples
RUN mv .sequelizerc.example .sequelizerc
RUN mv config.json.example config.json

ADD docker-entrypoint.sh /hackadoc/docker-entrypoint.sh
RUN chmod +x /hackadoc/docker-entrypoint.sh

# npm install
RUN npm install
# npm build
RUN npm run build

# npm dev dependencies
RUN npm prune --production

# remove build dependencies
RUN apt-get remove -y --auto-remove build-essential && \
        apt-get clean && apt-get purge && rm -r /var/lib/apt/lists/*

EXPOSE 3000

CMD ["node", "app.js"] 