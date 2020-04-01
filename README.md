CodiMD
===

[![build status][travis-image]][travis-url]
[![version][github-version-badge]][github-release-page]
[![Gitter][gitter-image]][gitter-url]
[![POEditor][poeditor-image]][poeditor-url]

CodiMD lets you collaborate in real-time with markdown.
Built on [HackMD](https://hackmd.io) source code, CodiMD lets you host and control your team's content with speed and ease.

![screenshot](https://raw.githubusercontent.com/hackmdio/codimd/develop/public/screenshot.png)

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# Table of Contents

- [HackMD](#hackmd)
- [CodiMD - The Open Source HackMD](#codimd---the-open-source-hackmd)
- [Documentation](#documentation)
  - [Deployment](#deployment)
  - [Configuration](#configuration)
  - [Upgrading and Migration](#upgrading-and-migration)
  - [Developer](#developer)
- [Contribution and Discussion](#contribution-and-discussion)
- [Browser Support](#browser-support)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## HackMD

[HackMD](https://hackmd.io) helps developers write better documents and build active communities with open collaboration.
HackMD is built with one promise - **You own and control all your content**:
- You should be able to easily [download all your online content at once](https://hackmd.io/c/news/%2Fs%2Fr1cx3a3SE).
- Your content formatting should be portable as well. (That's why we choose [markdown](https://hackmd.io/features#Typography).)
- You should be able to control your content's presentation with HTML, [slide mode](https://hackmd.io/p/slide-example), or [book mode](https://hackmd.io/c/book-example/).

## CodiMD - The Open Source HackMD

CodiMD is the free software version of [HackMD](https://hackmd.io), developed and opened source by the HackMD team with reduced features (without book mode), you can use CodiMD for your community and own all your data. *(See the [origin of the name CodiMD](https://github.com/hackmdio/hackmd/issues/720).)* 

CodiMD is perfect for open communities, while HackMD emphasizes on permission and access controls for commercial use cases. 

HackMD team is committed to keep CodiMD open source. All contributions are welcome!

## Documentation
You would find all documentation here: [CodiMD Documentation](https://hackmd.io/c/codimd-documentation)

### Deployment
If you want to spin up an instance and start using immediately, see [Docker deployment](https://hackmd.io/c/codimd-documentation/%2Fs%2Fcodimd-docker-deployment).
If you want to contribute to the project, start with [manual deployment](https://hackmd.io/c/codimd-documentation/%2Fs%2Fcodimd-manual-deployment).

### Configuration
CodiMD is highly customizable, learn about all configuration options of networking, security, performance, resources, privilege, privacy, image storage, and authentication in [CodiMD Configuration](https://hackmd.io/c/codimd-documentation/%2Fs%2Fcodimd-configuration).

### Upgrading and Migration
Upgrade CodiMD from previous version? See [this guide](https://hackmd.io/c/codimd-documentation/%2Fs%2Fcodimd-upgrade)<br>
Migrating from Etherpad? Follow [this guide](https://hackmd.io/c/codimd-documentation/%2Fs%2Fcodimd-migration-etherpad)

### Developer
Join our contributor community! Start from deploying [CodiMD manually](https://hackmd.io/c/codimd-documentation/%2Fs%2Fcodimd-manual-deployment), [connecting to your own database](https://hackmd.io/c/codimd-documentation/%2Fs%2Fcodimd-db-connection), [learn about the project structure](https://hackmd.io/c/codimd-documentation/%2Fs%2Fcodimd-project-structure), to [build your changes](https://hackmd.io/c/codimd-documentation/%2Fs%2Fcodimd-webpack) with the help of webpack.

## Contribution and Discussion
All contributions are welcome! Even asking a question helps.

| Project | Contribution Types | Contribution Venue |
| ------- | ------------------ | ------------------ |
|**CodiMD**|:couple: Community chat|[Gitter][gitter-url]|
||:bug: Issues, bugs, and feature requests|[Issue tracker](https://github.com/hackmdio/codimd/issues)|
||:books: Improve documentation|[Documentations](https://hackmd.io/c/codimd-documentation)|
||:pencil: Translation|[POEditor][poeditor-url]|
||:coffee: Donation|[Buy us coffee](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=KDGS4PREHX6QQ&lc=US&item_name=HackMD&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donate_LG%2egif%3aNonHosted)|
|**HackMD**|:question: Issues related to [HackMD](https://hackmd.io/)|[Issue tracker](https://github.com/hackmdio/hackmd-io-issues/issues)|
||:pencil2: Translation|[hackmd-locales](https://github.com/hackmdio/hackmd-locales/tree/master/locales)|

## Browser Support

CodiMD is a service that runs on Node.js, while users use the service through browsers. We support your users using the following browsers: 
- <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" alt="Chrome" width="24px" height="24px" /> Chrome >= 47, Chrome for Android >= 47
- <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png" alt="Safari" width="24px" height="24px" /> Safari >= 9, iOS Safari >= 8.4
- <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png" alt="Firefox" width="24px" height="24px" /> Firefox >= 44
- <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png" alt="IE / Edge" width="24px" height="24px" /> IE >= 9, Edge >= 12
- <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/opera/opera_48x48.png" alt="Opera" width="24px" height="24px" /> Opera >= 34, Opera Mini not supported
- Android Browser >= 4.4

To stay up to date with your installation it's recommended to subscribe the [release feed][github-release-feed].

## License

**License under AGPL.**

[gitter-image]: https://img.shields.io/badge/gitter-hackmdio/codimd-blue.svg	
[gitter-url]: https://gitter.im/hackmdio/hackmd
[travis-image]: https://travis-ci.com/hackmdio/codimd.svg?branch=master
[travis-url]: https://travis-ci.com/hackmdio/codimd
[github-version-badge]: https://img.shields.io/github/release/hackmdio/codimd.svg
[github-release-page]: https://github.com/hackmdio/codimd/releases
[github-release-feed]: https://github.com/hackmdio/codimd/releases.atom
[poeditor-image]: https://img.shields.io/badge/POEditor-translate-blue.svg
[poeditor-url]: https://poeditor.com/join/project/q0nuPWyztp
