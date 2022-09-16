const Ninja = require('utxoninja')
const bsv = require('bsv')
const { getPaymentAddress, getPaymentPrivateKey } = require('sendover')
const knex =
  process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging'
    ? require('knex')(require('../../knexfile.js').production)
    : require('knex')(require('../../knexfile.js').development)

module.exports = {
  type: 'post',
  path: '/checkForRoyalties',
  knex,
  summary: 'Use this route to check for royalty payments associated with your published song.',
  parameters: {
  },
  exampleResponse: {
  },
  func: async (req, res) => {
    try {
      // Calculate the amount that the artist is owed, by making queries against the database
      const royalties = await knex('royalty')
        .where({
          artistIdentityKey: req.authrite.identityKey, // TODO: update migration
          paid: false
        }).select('keyID', 'amount', 'paid')
      const totalAmount = royalties.reduce((accumulator, royalty) => {
        return accumulator + royalty.amount
      }, 0)
      // If there is no money waiting for the artist, the server responds to the client without creating a new output or transaction. This is not necessarily an error, just a notification that there is no money right now.
      if (totalAmount === 0) {
        return res.status(200).json('There are no royalties to be paid. Check back soon!')
      }
      // Derive an output for the payment from the artist’s identity public key (similar to how NanoStore-Publisher derivePaymentInfo works, but using Sendover directly instead of Babbage SDK getPublicKey)
      // Create a derivation prefix and suffix to derive the public key
      const derivationPrefix = require('crypto')
        .randomBytes(10)
        .toString('base64')
      const derivationSuffix = require('crypto')
        .randomBytes(10)
        .toString('base64')
      // Derive the public key used for creating the output script // protocolID: 3241645161d8?
      const derivedPrivateKey = getPaymentPrivateKey({
        senderPublicKey: req.authrite.identityKey,
        recipientPrivateKey: process.env.SERVER_PRIVATE_KEY,
        invoiceNumber: `2-tempo key server-${derivationPrefix} ${derivationSuffix}`,
        returnType: 'babbage-bsv'
      })
      const derivedPublicKey = getPaymentAddress({
        senderPrivateKey: derivedPrivateKey,
        recipientPublicKey: req.authrite.identityKey,
        invoiceNumber: `2-tempo key server-${derivationPrefix} ${derivationSuffix}`,
        returnType: 'publicKey'
      })

      // Create an output script that can only be unlocked with the corresponding derived private key
      const script = new bsv.Script(
        bsv.Script.fromAddress(bsv.Address.fromPublicKey(
          bsv.PublicKey.fromString(derivedPublicKey)
        ))
      ).toHex()
      // Return the new output
      const output = {
        script,
        satoshis: totalAmount
      }
      // Create a new transaction with Ninja which pays the output
      const ninja = new Ninja({
        privateKey: derivedPrivateKey,
        config: {
          dojoURL: process.env.DOJO_URL
        }
      })
      // TODO:
      // const tx = await ninja.createTransaction({
      // })
      const processedTransaction = await ninja.submitDirectTransaction({
        protocol: 'tempo key server',
        transaction: { // vout somewhere, or no because this is the only output?
          outputs: [output]
        },
        senderIdentityKey: bsv.PrivateKey.fromHex(process.env.SERVER_PRIVATE_KEY).publicKey.toString(),
        note: 'Royalties paid for x song(s)...',
        derivationPrefix,
        amount: totalAmount
      })
      // Make note of the fact that the payment has been sent in the database, so that the amount the artist is owed decreases by the amount of the transaction
      await knex('royalty')
        .where({
          artistIdentityKey: req.authrite.identityKey,
          paid: false
        })
        .update({
          referenceNumber: processedTransaction.referenceNumber,
          paid: true
        })
      // Save the artist payment transaction in the database for our records (and so that, in the future, the artist could come back and process the payment if they ever dropped offline in the middle)
      // Do we need a transactions table?
      // Hand the new payment transaction to the artist ? Using the SDK?
    } catch {

    }
  }
}
