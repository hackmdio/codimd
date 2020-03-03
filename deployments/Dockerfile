FROM hackmdio/buildpack:1.0.4 as BUILD

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
        config.json.example README.md CONTRIBUTING.md AUTHORS

FROM hackmdio/runtime:1.0.6
USER hackmd
WORKDIR /home/hackmd/app
COPY --chown=1500:1500 --from=BUILD /home/hackmd/app .
EXPOSE 3000
ENTRYPOINT ["/home/hackmd/app/docker-entrypoint.sh"]
