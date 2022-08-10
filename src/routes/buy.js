const knex =
  process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging'
    ? require('knex')(require('../../knexfile.js').production)
    : require('knex')(require('../../knexfile.js').development)

module.exports = {
  type: 'post',
  path: '/buy',
  knex,
  summary: 'Use this route to buy a song decryption key',
  // Parameters given in query string
  parameters: {
    songURL: 'abc',
    key: ''
  },
  exampleResponse: {
  },
  func: async (req, res) => {
    try {
      // Check if a key entry exists already.
      const [key] = await knex('key').where({
        songURL: req.query.songURL
      }).select('value')

      if (!key) {
        return res.status(400).json({
          status: 'Key not found'
        })
      }

      // TODO: add payment

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
