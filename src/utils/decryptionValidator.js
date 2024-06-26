const { decrypt } = require('cwi-crypto')
const { Crypto } = require('@peculiar/webcrypto')
global.crypto = new Crypto()
const { download } = require('nanoseek')

/**
 * @param {string} songURL UHRP url of the song to decrypt
 * @param {string} key decryption key to use. Must be a 32 byte base64 string!
 * @returns {Boolean} Returns the result of the decryption attempt
 */
const isValid = async (songURL, key) => {
  // Sometimes, the NanoStore file is still uploading. We try 5 times, 5
  // seconds apart, to give it time to finish sending the UHRP advertisement.
  if (!songURL || !key){
    return false
  }

  for (let i = 1; i <= 5; i++) {
    try {
      // Fetch the song data
      const { data: encryptedData } = await download({
        UHRPUrl: songURL,
        confederacyHost: process.env.NODE_ENV === 'staging'
          ? 'https://staging-confederacy.babbage.systems'
          : process.env.NODE_ENV === 'production'
            ? undefined
            : 'https://staging-confederacy.babbage.systems',
          clientPrivateKey: process.env.SERVER_PRIVATE_KEY
      })
      const keyAsBuffer = Buffer.from(key, 'base64')
      const decryptionKey = await global.crypto.subtle.importKey(
        'raw',
        new Uint8Array(keyAsBuffer),
        {
          name: 'AES-GCM'
        },
        true,
        ['decrypt']
      )
      // Try to decrypt the song data
      await decrypt(
        new Uint8Array(encryptedData),
        decryptionKey,
        'Uint8Array'
      )
      return true
    } catch (error) {
      console.error(error)
      // Wait 5 seconds to see if the error resolves
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }
  return false
}
module.exports = { isValid }
