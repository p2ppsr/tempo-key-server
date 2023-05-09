const knex =
  process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging'
    ? require('knex')(require('../../knexfile.js').production)
    : require('knex')(require('../../knexfile.js').development)
const decryptionValidator = require('../utils/decryptionValidator')

module.exports = {
  type: 'post',
  path: '/publish',
  knex,
  summary: 'Use this route to publish a song decryption key',
  parameters: {
    songURL: 'abc', // A UHRP url of the song to decrypt
    key: '' // A 32 byte base64 string.
  },
  exampleResponse: {
    status: 'Key sucessfully published!'
  },
  func: async (req, res) => {
    try {
      if (!req.body.songURL || !req.body.key) {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_INVALID_PARAMS',
          description: 'Must provide valid parameters'
        })
      }
      // Check if a key entry exists already.
      const [key] = await knex('key').where({
        songURL: req.body.songURL
      }).select('value')
      if (!key) {
        // Validate Song Decryption
        const isValid = await decryptionValidator.isValid(req.body.songURL, req.body.key)
        if (!isValid) {
          return res.status(400).json({
            status: 'error',
            code: 'ERR_INVALID_DECRYPTION_KEY',
            description: 'Failed to validate decryption key!'
          })
        }
        // Insert a new key entry
        await knex('key').insert({
          songURL: req.body.songURL,
          value: req.body.key,
          artistIdentityKey: req.authrite.identityKey // TODO: Verify they own the song with a certificate authority
        })
      } else {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_DUPLICATE_DECRYPTION_KEY',
          description: 'Key already published to key server!'
        })
      }
      return res.status(200).json({
        status: 'Key sucessfully published!'
      })
    } catch (e) {
      console.error(e)
      return res.status(500).json({
        status: 'error',
        code: 'ERR_INTERNAL',
        description: 'An internal error has occurred.'
      })
    }
  }
}
