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
    referenceNumber: 'xyz', // payment reference number to validate,
    description: '',
    paymail: '',
    orderID: 'abc'
  },
  exampleResponse: {
  },
  func: async (req, res) => {
    try {
      // Create a new ninja for the server
      const ninja = new Ninja({
        privateKey: process.env.SERVER_PRIVATE_KEY,
        config: {
          dojoURL: process.env.DOJO_URL
        }
      })

      // Find valid decryption key
      const [key] = await knex('key').where({
        songURL: req.body.songURL
      }).select('value', 'keyID')

      if (!key) {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_KEY_NOT_FOUND',
          description: 'Decryption key for specified song not found!'
        })
      }

      // Find valid purchase invoice
      const [invoice] = await knex('invoice').where({
        keyID: key.keyID,
        identityKey: req.authrite.identityKey,
        orderID: req.body.orderID
      })
      if (!invoice) {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_INVOICE_NOT_FOUND',
          description: 'An invoice for the specified purchase was not found!'
        })
      }

      // Verify the payment
      const processed = await ninja.verifyIncomingTransaction({ senderPaymail: req.body.paymail, senderIdentityKey: req.authrite.identityKey, referenceNumber: req.body.referenceNumber, description: req.body.description, amount: invoice.amount })
      if (!processed) {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_PAYMENT_INVALID',
          description: 'Could not validate payment!'
        })
      }
      // Update invoice
      await knex('invoice')
        .where({ keyID: key.keyID, identityKey: req.authrite.identityKey, orderID: req.body.orderID, referenceNumber: null, paymail: null, processed: false })
        .update({ paymail: req.body.paymail, referenceNumber: req.body.referenceNumber, processed: true })

      // Return the decryption key to the sender
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
