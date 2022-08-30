const { decrypt } = require('@cwi/crypto')
const { Crypto } = require('@peculiar/webcrypto')
global.crypto = new Crypto()
const { download } = require('nanoseek')

/**
 * @param {string} songURL UHRP url of the song to decrypt
 * @param {string} key decryption key to use. Must be a 32 byte base64 string!
 * @returns {Boolean} Returns the result of the decryption attempt
 */
const isValid = async (songURL, key) => {
  try {
    // Fetch the song data
    const { data: encryptedData } = await download({ URL: songURL })
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
    return false
  }
}
module.exports = { isValid }
