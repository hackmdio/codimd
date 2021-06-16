import {RequestHandler} from "express";
import config from "./config";
import uuid from "uuid";


const CspStrategy: {
  computeDirectives?: () => Record<string, string[]>
  addNonceToLocals?: RequestHandler
} = {}

const defaultDirectives = {
  defaultSrc: ['\'self\''],
  scriptSrc: ['\'self\'', 'vimeo.com', 'https://gist.github.com', 'www.slideshare.net', 'https://query.yahooapis.com', '\'unsafe-eval\''],
  // ^ TODO: Remove unsafe-eval - webpack script-loader issues https://github.com/hackmdio/codimd/issues/594
  imgSrc: ['*', 'data:'],
  styleSrc: ['\'self\'', '\'unsafe-inline\'', 'https://github.githubassets.com'], // unsafe-inline is required for some libs, plus used in views
  fontSrc: ['\'self\'', 'data:', 'https://public.slidesharecdn.com'],
  objectSrc: ['*'], // Chrome PDF viewer treats PDFs as objects :/
  mediaSrc: ['*'],
  childSrc: ['*'],
  connectSrc: ['*']
}

const dropboxDirectives = {
  scriptSrc: ['https://www.dropbox.com']
}

const cdnDirectives = {
  scriptSrc: ['https://cdnjs.cloudflare.com', 'https://cdn.jsdelivr.net', 'https://cdn.mathjax.org'],
  styleSrc: ['https://cdnjs.cloudflare.com', 'https://cdn.jsdelivr.net', 'https://fonts.googleapis.com'],
  fontSrc: ['https://cdnjs.cloudflare.com', 'https://fonts.gstatic.com']
}

const disqusDirectives = {
  scriptSrc: ['https://disqus.com', 'https://*.disqus.com', 'https://*.disquscdn.com'],
  styleSrc: ['https://*.disquscdn.com'],
  fontSrc: ['https://*.disquscdn.com']
}

const googleAnalyticsDirectives = {
  scriptSrc: ['https://www.google-analytics.com']
}

CspStrategy.computeDirectives = function () {
  const directives: Record<string, string[]> = {}
  mergeDirectives(directives, config.csp.directives)
  mergeDirectivesIf(config.csp.addDefaults, directives, defaultDirectives)
  mergeDirectivesIf(config.useCDN, directives, cdnDirectives)
  mergeDirectivesIf(config.dropbox && config.dropbox.appKey, directives, dropboxDirectives)
  mergeDirectivesIf(config.csp.addDisqus, directives, disqusDirectives)
  mergeDirectivesIf(config.csp.addGoogleAnalytics, directives, googleAnalyticsDirectives)
  if (!areAllInlineScriptsAllowed(directives)) {
    addInlineScriptExceptions(directives)
  }
  addUpgradeUnsafeRequestsOptionTo(directives)
  addReportURI(directives)
  return directives
}

function mergeDirectives(existingDirectives: Record<string, string[]>, newDirectives: Record<string, string[]>) {
  for (const propertyName in newDirectives) {
    if (Object.hasOwnProperty.call(newDirectives, propertyName)) {
      const newDirective = newDirectives[propertyName]
      if (newDirective) {
        const existingDirective = existingDirectives[propertyName] || []
        existingDirectives[propertyName] = existingDirective.concat(newDirective)
      }
    }
  }
}

function mergeDirectivesIf(condition, existingDirectives, newDirectives) {
  if (condition) {
    mergeDirectives(existingDirectives, newDirectives)
  }
}

function areAllInlineScriptsAllowed(directives) {
  return directives.scriptSrc.indexOf('\'unsafe-inline\'') !== -1
}

function addInlineScriptExceptions(directives) {
  directives.scriptSrc.push(getCspNonce)
  // TODO: This is the SHA-256 hash of the inline script in build/reveal.js/plugins/notes/notes.html
  // Any more clean solution appreciated.
  directives.scriptSrc.push('\'sha256-81acLZNZISnyGYZrSuoYhpzwDTTxi7vC1YM4uNxqWaM=\'')
}

function getCspNonce(req, res) {
  return "'nonce-" + res.locals.nonce + "'"
}

function addUpgradeUnsafeRequestsOptionTo(directives) {
  if (config.csp.upgradeInsecureRequests === 'auto' && config.useSSL) {
    directives.upgradeInsecureRequests = true
  } else {
    if (config.csp.upgradeInsecureRequests === true) {
      directives.upgradeInsecureRequests = true
    }
  }
}

function addReportURI(directives) {
  if (config.csp.reportURI) {
    directives.reportUri = config.csp.reportURI
  }
}

CspStrategy.addNonceToLocals = function (req, res, next) {
  res.locals.nonce = uuid.v4()
  next()
}

export = CspStrategy
