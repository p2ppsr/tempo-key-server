const knex =
  process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging'
    ? require('knex')(require('../../knexfile.js').production)
    : require('knex')(require('../../knexfile.js').development)

module.exports = {
  type: 'post',
  path: '/publish',
  knex,
  summary: 'Use this route to publish a song decryption key',
  // Parameters given in query string
  parameters: {
    songID: 'abc',
    bridgeID: 'xyz',
    key: ''
  },
  exampleResponse: {
  },
  func: async (req, res) => {
    try {
      // Check if a key entry exists already.
      let [key] = await knex('key').where({
        songID: req.query.songID,
        bridgeID: req.query.bridgeID
      }).select('value')
      if (!key) {
      // Insert a new key entry
        key = await knex('key').insert({
          songID: req.query.songID,
          bridgeID: req.query.bridgeID,
          value: req.query.value
        })
      } else {
        return res.status(400).json({
          status: 'Key already published to key server!'
        })
      }
      if (!key) {
        return res.status(400).json({
          status: 'Failed to publish key'
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
