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
  },
  func: async (req, res) => {
    try {
      // Check if a key entry exists already.
      let [key] = await knex('key').where({
        songURL: req.body.songURL
      }).select('value')
      if (!key) {
        // Validate Song Decryption
        const isValid = await decryptionValidator.isValid(req.body.songURL, req.body.key)
        if (!isValid) {
          return res.status(400).json({
            status: 'Failed to validate decryption key!'
          })
        }
        // Insert a new key entry
        [key] = await knex('key').insert({
          songURL: req.body.songURL,
          value: req.body.key
        })
        if (!key) {
          return res.status(400).json({
            status: 'Failed to publish key'
          })
        }
      } else {
        return res.status(400).json({
          status: 'Key already published to key server!'
        })
      }
      return res.status(200).json({
        status: 'Key sucessfully published!'
      })
    } catch (e) {
      res.status(500).json({
        status: 'error',
        code: 'ERR_INTERNAL',
        description: 'An internal error has occurred.'
      })
      console.error(e)
      return null
    }
  }
}
