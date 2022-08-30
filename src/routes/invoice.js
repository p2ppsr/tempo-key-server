const crypto = require('crypto')
const knex =
  process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging'
    ? require('knex')(require('../../knexfile.js').production)
    : require('knex')(require('../../knexfile.js').development)
const bsv = require('bsv')

// TODO: Determine best amount
const AMOUNT = 100

const { SERVER_PRIVATE_KEY } = process.env

module.exports = {
  type: 'post',
  path: '/invoice',
  knex,
  summary: 'Requests an invoice for purchasing a song',
  parameters: {
    songURL: 'abc'
  },
  exampleResponse: {
    status: 'success',
    amount: 1337,
    identityKey: 'adfsfdf',
    orderID: 'asdfldsf=s=sfsd'
  },
  func: async (req, res) => {
    try {
      // Find valid decryption key
      const [key] = await knex('key').where({
        songURL: req.body.songURL
      }).select('keyID')
      if (!key) {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_KEY_NOT_FOUND',
          description: 'Decryption key for specified song not found!'
        })
      }

      // Create a new invoice record
      const ORDER_ID = crypto.randomBytes(32).toString('base64')
      await knex('invoice').insert({
        orderID: ORDER_ID,
        keyID: key.keyID,
        identityKey: req.authrite.identityKey,
        amount: AMOUNT,
        processed: false
      })

      // Return the required info to the sender
      return res.status(200).json({
        status: 'success',
        identityKey: bsv.PrivateKey.fromString(SERVER_PRIVATE_KEY)
          .publicKey.toString(),
        amount: AMOUNT,
        orderID: ORDER_ID
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
