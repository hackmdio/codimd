'use strict'
const Router = require('express').Router
const passport = require('passport')
const Issuer = require('openid-client').Issuer

const Strategy = require('openid-client').Strategy

const config = require('../../../config')
const logger = require('../../../logger')
const models = require('../../../models')
const intersection = function (array1, array2) {
  return array1.filter((n) => array2.includes(n))
}

let ipsilonAuth = module.exports = Router()

Issuer.discover(config.ipsilon.issuerHost).then(
  function (ipsilonIssuer) {
    var client = new ipsilonIssuer.Client({
      client_id: config.ipsilon.clientID,
      client_secret: config.ipsilon.clientSecret,
      userinfo_signed_response_alg: 'RS256',
      scope: 'openid profile email phone',
      claims: {
        userinfo: {
          name: {
            essential: true
          },
          email: {
            essential: true
          },
          picture: null,
          _groups: null
        },
        id_token: {
          auth_time: {
            essential: true
          }
        }
      }
    })

    var params = {
      redirect_uri: config.serverurl + '/auth/ipsilon/callback',
      scope: client.scope,
      claims: client.claims
    }

    passport.use('oidc',
      new Strategy({
        client: client,
        params: params,
        usePKCE: false
      }, (tokenset, done) => {
        client.userinfo(tokenset.access_token, {
          params: {
            scope: params.scope,
            claims: params.claims
          }
        }).then(function (userinfo) {
          // check authorization: deny any of the external groups
          if (config.ipsilon.externalGroups) {
            // lack of external groups in userinfo does not prevent logon
            if (userinfo._groups) {
              var externalGroups = intersection(config.ipsilon.externalGroups, userinfo._groups)
              if (externalGroups.length > 0) {
                logger.error('ipsilon permission denied: ' + externalGroups.join(', '))
                return done('Permission denied', null)
              }
            }
          }
          // check authorization: require any of the required groups
          if (config.ipsilon.requiredGroups) {
            // lack of required groups in userinfo denies logon
            if (!userinfo._groups && config.ipsilon.requiredGroups.length > 0) {
              logger.error('ipsilon permission denied')
              return done('Permission denied', null)
            }
            if (intersection(config.ipsilon.requiredGroups, userinfo._groups).length === 0) {
              logger.error('ipsilon permission denied')
              return done('Permission denied', null)
            }
          }
          // create a user
          var uuid = userinfo.sub
          var profile = {
            provider: 'ipsilon',
            id: 'IPSILON-' + uuid,
            username: uuid,
            emails: userinfo.email ? [userinfo.email] : []
          }
          var stringifiedProfile = JSON.stringify(profile)

          models.User.findOrCreate({
            where: {
              profileid: profile.id.toString()
            },
            defaults: {
              profile: stringifiedProfile
            }
          }).spread(function (user, created) {
            if (user) {
              var needSave = false
              if (user.profile !== stringifiedProfile) {
                user.profile = stringifiedProfile
                needSave = true
              }
              if (needSave) {
                user.save().then(function () {
                  if (config.debug) {
                    logger.debug('user login: ' + user.id)
                  }
                  return done(null, user)
                })
              } else {
                if (config.debug) {
                  logger.debug('user login: ' + user.id)
                }
                return done(null, user)
              }
            }
          }).catch(function (err) {
            logger.error('ipsilon auth failed: ' + err)
            return done(err, null)
          })
        })
      })
    )

    ipsilonAuth.get('/auth/ipsilon',
      passport.authenticate('oidc', {
        successReturnToOrRedirect: config.serverurl + '/',
        failureRedirect: config.serverurl + '/'
      })
    )

    ipsilonAuth.get('/auth/ipsilon/callback',
      passport.authenticate('oidc', {
        successReturnToOrRedirect: config.serverurl + '/',
        failureRedirect: config.serverurl + '/'
      })
    )
  })
