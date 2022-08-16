const Ninja = require('utxoninja')
const knex =
  process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging'
    ? require('knex')(require('../../knexfile.js').production)
    : require('knex')(require('../../knexfile.js').development)

const AMOUNT = 100

module.exports = {
  type: 'post',
  path: '/invoice',
  knex,
  summary: 'Requests an invoice for purchasing a song',
  parameters: {
    songURL: 'abc'
  },
  exampleResponse: {
  },
  func: async (req, res) => {
    try {
      const ninja = new Ninja({
        privateKey: '6dcc124be5f382be631d49ba12f61adbce33a5ac14f6ddee12de25272f943f8b',
        config: {
          dojoURL: 'http://localhost:3102' // TODO: update for prod
        }
      })
      const [key] = await knex('key').where({
        songURL: req.body.songURL
      }).select('keyID')

      await knex('invoice').insert({
        keyID: key.keyID,
        identityKey: req.authrite.identityKey,
        paymail: null,
        amount: AMOUNT,
        processed: false
      })

      // Get the server's paymail
      const paymail = await ninja.getPaymail()
      return res.status(200).json({
        status: 'success',
        paymail,
        amount: AMOUNT // ?
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
