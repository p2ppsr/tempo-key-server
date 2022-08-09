const knex =
  process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging'
    ? require('knex')(require('../../knexfile.js').production)
    : require('knex')(require('../../knexfile.js').development)

module.exports = {
  type: 'post',
  path: '/store',
  knex,
  summary: 'Use this route to buy a song decryption key',
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
      let key = await knex('key').where({
        songID: req.query.songID,
        bridgeID: req.query.bridgeID
      }).select('value')

      if (!key || key.length === 0) {
      // Insert a new key entry
        key = await knex('key').insert({
          songID: req.query.songID,
          bridgeID: req.query.bridgeID,
          value: req.query.value
        })
      }
      if (!key) {
        return res.status(400).json({
          status: 'Failed to store key'
        })
      }
      return res.status(200).json({
        status: 'Key sucessfully purchased!',
        result: key.value
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
