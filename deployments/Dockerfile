FROM node:8.15.1-jessie AS BUILD
# use multi-stage build to build frontend javascript
WORKDIR /hackmd

COPY . ./

RUN yarn install --non-interactive --pure-lockfile && \
    yarn build

# ----------------------------------------------------
# Runtime Stage
FROM node:8.15.1 AS RUNTIME

# build for production
ENV NODE_ENV production
ENV PATH="/home/hackmd/.npm-global/bin:${PATH}"

# setup isolated user for more security
ARG USER_NAME=hackmd
ARG UID=1500
ARG GID=1500

RUN set +x -ue && \
    wget https://github.com/hackmdio/portchecker/releases/download/v1.0.1/portchecker-linux-amd64.tar.gz && \
    tar xvf portchecker-linux-amd64.tar.gz -C /usr/local/bin && \
    mv /usr/local/bin/portchecker-linux-amd64 /usr/local/bin/pcheck && \
    # Add user and groupd
    groupadd --gid $GID $USER_NAME && \
    useradd --uid $UID --gid $USER_NAME --no-log-init --create-home $USER_NAME && \
    # setup local npm global directory
    mkdir /home/hackmd/.npm-global && \
    echo "prefix=/home/hackmd/.npm-global/" > /home/hackmd/.npmrc && \
    # setup app dir
    mkdir /hackmd && \
    # adjust permission
    chown -R $USER_NAME:$USER_NAME /home/hackmd

# Copy build stage file to runtime
COPY --from=BUILD /hackmd /hackmd
RUN chown -R $USER_NAME:$USER_NAME /hackmd

# change running user name
USER $USER_NAME
# build project
WORKDIR /hackmd

RUN set +x -ue && \
    cliVer=$(cat package.json | grep sequelize-cli | awk '{print substr($1, 2, length($1) - 3)"@"substr($2, 2, length($2) - 3)}') && \
    npm -g install "$cliVer" && \
    yarn install --production --non-interactive --pure-lockfile && \
    yarn cache clean

VOLUME /hackmd/public/uploads
EXPOSE 3000

ENTRYPOINT ["/hackmd/docker-entrypoint.sh"]
