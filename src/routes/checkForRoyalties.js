const { Ninja } = require('ninja-base')
const bsv = require('babbage-bsv')
const { getPaymentAddress } = require('sendover')
const knex =
  process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging'
    ? require('knex')(require('../../knexfile.js').production)
    : require('knex')(require('../../knexfile.js').development)

module.exports = {
  type: 'get',
  path: '/checkForRoyalties',
  knex,
  summary: 'Use this route to check for royalty payments associated with your published songs.',
  parameters: {},
  exampleResponse: {
    status: 'Royalty payment sent!',
    transaction: {
      rawTx: '{valid raw tx}',
      txid: 'af4bd8af92891c99af7b5be14a7c8f71b482ee0315b1496aff573906ceaa3a5d',
      mapiResponses: {},
      note: 'The transaction has been processed and broadcast.',
      amount: 100,
      inputs: []
    },
    derivationPrefix: '0BCWcCOywvBW/g==',
    derivationSuffix: '6p4s56lfJELNjQ==',
    amount: 85,
    senderIdentityKey: '04b51d497f8c67c1416cfe1a58daa5a576a63eb0b64608922d5c4f98b6a1d9b103f9c42cd08b1376ec1932be02c7debdc5314fa563d383d61f8110a5df910bc719'
  },
  func: async (req, res) => {
    try {
      // Calculate the amount that the artist is owed, by making queries against the database
      const royalties = await knex('royalty')
        .where({
          artistIdentityKey: req.authrite.identityKey,
          paid: false
        }).select('keyID', 'amount', 'paid')
      const totalAmount = royalties.reduce((accumulator, royalty) => {
        return accumulator + royalty.amount
      }, 0)
      // If there is no money waiting for the artist, the server responds to the client without creating a new output or transaction. This is not necessarily an error, just a notification that there is no money right now.
      if (totalAmount === 0) {
        return res.status(200).json({
          status: 'There are no royalties to be paid. Check back soon!'
        })
      }
      // Create a derivation prefix and suffix to derive the public key
      const derivationPrefix = require('crypto')
        .randomBytes(10)
        .toString('base64')
      const derivationSuffix = require('crypto')
        .randomBytes(10)
        .toString('base64')
      // Derive the public key used for creating the output script
      const derivedPublicKey = getPaymentAddress({
        senderPrivateKey: process.env.SERVER_PRIVATE_KEY,
        recipientPublicKey: req.authrite.identityKey,
        invoiceNumber: `2-3241645161d8-${derivationPrefix} ${derivationSuffix}`,
        returnType: 'publicKey'
      })

      // Create an output script that can only be unlocked with the corresponding derived private key
      const script = new bsv.Script(
        bsv.Script.fromAddress(bsv.Address.fromPublicKey(
          bsv.PublicKey.fromString(derivedPublicKey)
        ))
      ).toHex()
      // Create a new output to spend
      const outputs = [{
        script,
        satoshis: totalAmount
      }]
      // Create a new transaction with Ninja which pays the output
      const ninja = new Ninja({
        privateKey: process.env.SERVER_PRIVATE_KEY,
        config: {
          dojoURL: process.env.DOJO_URL
        }
      })

      const transaction = await ninja.getTransactionWithOutputs({
        outputs,
        note: 'Sent royalty payment to artist.'
      })

      // Save the artist payment transaction in the database for our records (and so that, in the future, the artist could come back and process the payment if they ever dropped offline in the middle)
      await knex('outgoingRoyaltyPayment').insert({
        transaction: JSON.stringify(transaction),
        derivationPrefix,
        derivationSuffix,
        amount: totalAmount,
        created_at: new Date(),
        updated_at: new Date()
      })
      // Retrieve the just created outgoingRoyaltyPayment entry
      const [outgoingRoyaltyPayment] = await knex('outgoingRoyaltyPayment')
        .where({
          derivationPrefix,
          derivationSuffix,
          amount: totalAmount
        }).select('Id')
      // Make note of the fact that the payment has been sent in the database, so that the amount the artist is owed decreases by the amount of the transaction
      await knex('royalty')
        .where({
          artistIdentityKey: req.authrite.identityKey,
          paid: false
        })
        .update({
          paymentId: outgoingRoyaltyPayment.Id,
          paid: true,
          updated_at: new Date()
        })

      return res.status(200).json({
        status: 'Royalty payment sent!',
        transaction,
        derivationPrefix,
        derivationSuffix,
        amount: totalAmount,
        senderIdentityKey: bsv.PrivateKey.fromHex(process.env.SERVER_PRIVATE_KEY).publicKey.toString()
      })
    } catch (e) {
      console.error(e)
      return res.status(500).json({
        status: 'error',
        code: 'ERR_INTERNAL',
        description: 'An internal error has occurred.'
      })
    }
  }
}
