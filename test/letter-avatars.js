'use strict'

const assert = require('assert');
const avatars = require('../lib/letter-avatars')

describe('generateAvatarURL()', function() {
  it('should return correct urls', function() {
    assert.equal(avatars.generateAvatarURL('Daan Sprenkels', 'hello@dsprenkels.com', true), 'https://www.gravatar.com/avatar/d41b5f3508cc3f31865566a47dd0336b?s=400');
    assert.equal(avatars.generateAvatarURL('Daan Sprenkels', 'hello@dsprenkels.com', false), 'https://www.gravatar.com/avatar/d41b5f3508cc3f31865566a47dd0336b?s=96');
  });
});
