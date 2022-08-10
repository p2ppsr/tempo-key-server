const Ninja = require('utxoninja')
const knex =
  process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging'
    ? require('knex')(require('../../knexfile.js').production)
    : require('knex')(require('../../knexfile.js').development)

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
        privateKey: process.env.SERVER_PRIVATE_KEY,
        config: {
          dojoURL: 'https://staging-dojo.babbage.systems' // TODO: update for prod
        }
      })
      // Get the server's paymail
      const paymail = await ninja.getPaymail()
      return res.status(200).json({
        status: 'success',
        paymail,
        amount: 100 // ?
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
