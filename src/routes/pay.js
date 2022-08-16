const e = require('express')
const Ninja = require('utxoninja')
const knex =
  process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging'
    ? require('knex')(require('../../knexfile.js').production)
    : require('knex')(require('../../knexfile.js').development)

module.exports = {
  type: 'post',
  path: '/pay',
  knex,
  summary: 'Use this route to submit proof of payment for a song decryption key',
  parameters: {
    songURL: 'abc',
    referenceNumber: 'no payment' // payment reference number to validate
  },
  exampleResponse: {
  },
  func: async (req, res) => {
    try {
      const ninja = new Ninja({
        privateKey: process.env.SERVER_PRIVATE_KEY,
        config: {
          dojoURL: 'http://localhost:3102' // TODO: update for prod
        }
      })

      // Check if a key entry exists already.
      const [key] = await knex('key').where({
        songURL: req.body.songURL
      }).select('value', 'keyID')

      if (!key) {
        return res.status(400).json({
          status: 'Key not found'
        })
      }

      const [invoice] = await knex('invoice').where({
        keyID: key.keyID,
        identityKey: req.authrite.identityKey
      })
      if (!invoice) {
        return res.status(400).json({
          status: 'Invoice not found!'
        })
      }

      const processed = await ninja.verifyIncomingTransaction({ senderPaymail: req.body.paymail, senderIdentityKey: req.authrite.identityKey, referenceNumber: req.body.referenceNumber, amount: invoice.amount })
      if (!processed) {
        return res.status(400).json({
          status: 'Payment not provided!'
        })
      }
      // Update invoice
      await knex('invoice')
        .where({ keyID: key.keyID, identityKey: req.authrite.identityKey, referenceNumber: null, paymail: null, processed: false })
        .update({ paymail: req.body.paymail, referenceNumber: req.body.referenceNumber, processed: true })

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
