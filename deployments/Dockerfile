ARG RUNTIME

FROM hackmdio/buildpack:node-10-0baafb79 as BUILD

COPY --chown=hackmd:hackmd . .

RUN set -xe && \
    git reset --hard && \
    git clean -fx && \
    npm install && \
    npm run build && \
    cp ./deployments/docker-entrypoint.sh ./ && \
    cp .sequelizerc.example .sequelizerc && \
    rm -rf .git .gitignore .travis.yml .dockerignore .editorconfig .babelrc .mailmap .sequelizerc.example \
        test docs contribute \
        package-lock.json webpack.prod.js webpack.htmlexport.js webpack.dev.js webpack.common.js \
        config.json.example README.md CONTRIBUTING.md AUTHORS node_modules

FROM $RUNTIME
USER hackmd
WORKDIR /home/hackmd/app
COPY --chown=1500:1500 --from=BUILD /home/hackmd/app .
RUN npm install --production && npm cache clean --force && rm -rf /tmp/{core-js-banners,phantomjs}
EXPOSE 3000
ENTRYPOINT ["/home/hackmd/app/docker-entrypoint.sh"]
