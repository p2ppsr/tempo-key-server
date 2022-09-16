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
    songURL: 'The URL of the song associated with the orderID',
    orderID: 'abc',
    transaction: 'transaction envelope (rawTx, mapiResponses, inputs, proof), with additional outputs array containing key derivation information',
    'transaction.outputs': 'An array of outputs descriptors, each including vout, satoshis, derivationPrefix(optional, if global not used), and derivationSuffix',
    derivationPrefix: 'Provide the global derivation prefix for the payment'
  },
  exampleResponse: {
    status: 'Key sucessfully purchased!', // !!!!!!!!!!
    result: 'sjfsdofdjffjo'
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
      }).select('value', 'keyID', 'artistIdentityKey')

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

      req.body.transaction.outputs = req.body.transaction.outputs.map(x => ({
        ...x,
        senderIdentityKey: req.authrite.identityKey
      }))

      // Verify the payment
      let processedTransaction
      try {
        processedTransaction = await ninja.submitDirectTransaction({
          protocol: '3241645161d8',
          transaction: req.body.transaction,
          senderIdentityKey: req.authrite.identityKey,
          note: `payment for orderID:${req.body.orderID}`,
          derivationPrefix: req.body.derivationPrefix,
          amount: invoice.amount
        })
      } catch (e) { // Propagate processing errors to the client
        if (!e.code) throw e
        return res.status(400).json({
          status: 'error',
          code: e.code,
          description: e.message,
          outputIndex: e.outputIndex
        })
      }
      if (!processedTransaction) {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_PAYMENT_INVALID',
          description: 'Could not validate payment!'
        })
      }
      // Update invoice
      await knex('invoice')
        .where({
          keyID: key.keyID,
          identityKey: req.authrite.identityKey,
          orderID: req.body.orderID,
          processed: false
        })
        .update({
          referenceNumber: processedTransaction.referenceNumber,
          processed: true
        })

      await knex('royalty').insert({
        keyID: key.keyID,
        artistIdentityKey: key.artistIdentityKey,
        amount: invoice.amount * 0.85,
        paid: false
      })

      // Return the decryption key to the sender
      return res.status(200).json({
        status: 'Key sucessfully purchased!', // !!!!!!!!!
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
