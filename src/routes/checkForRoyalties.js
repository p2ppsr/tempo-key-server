const Ninja = require('utxoninja')
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
      // Create a new ninja for the server
      const ninja = new Ninja({
        privateKey: process.env.SERVER_PRIVATE_KEY,
        config: {
          dojoURL: process.env.DOJO_URL
        }
      })

      // Calculate the amount that the artist is owed, by making queries against the database
      const royalties = await knex('royalty')
        .where({
          artistIdentityKey: req.authrite.identityKey,
          paid: false
        }).select('keyID', 'amount')
        // Maybe verify keyID is valid?
      const totalAmount = royalties.reduce((accumulator, royalty) => {
        return accumulator + royalty.amount
      }, 0)
      // If there is no money waiting for the artist, the server responds to the client without creating a new output or transaction. This is not necessarily an error, just a notification that there is no money right now.
      if (totalAmount === 0) {
        return res.status(200).json('There are no royalties to be paid. Check back soon!')
      }
      // Derive an output for the payment from the artist’s identity public key (similar to how NanoStore-Publisher derivePaymentInfo works, but using Sendover directly instead of Babbage SDK getPublicKey)

      // Create a new transaction with Ninja which pays the output
      // Make note of the fact that the payment has been sent in the database, so that the amount the artist is owed decreases by the amount of the transaction
      // Save the artist payment transaction in the database for our records (and so that, in the future, the artist could come back and process the payment if they ever dropped offline in the middle)
      // Hand the new payment transaction to the artist
    } catch {

    }
  }
}
