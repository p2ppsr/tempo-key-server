const { Authrite } = require('authrite-js')
const publishKey = async () => {
  const response = await new Authrite().request('http://localhost:8080/publish', {
    body: {
      songURL: 'XUTBG1hsvE4ANoVczeLRBjorb7AVe18V4EnouBxfJ2ErgiM2J9SC',
      key: 'xNczJM99pQOX+UXZ1expnqQdzQBArFyCFzneIFXi5To='
    },
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  return JSON.parse(Buffer.from(response.body).toString('utf8'))
}
const checkForRoyalties = async () => {
  const response = await new Authrite().request('http://localhost:8080/checkForRoyalties', {
    body: {
    },
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  return JSON.parse(Buffer.from(response.body).toString('utf8'))
}
// OLD - TODO: Delete
// const buyKey = async () => {
//   const response = await new Authrite().request('http://localhost:8080/buy', {
//     body: {
//       songURL: 'XUTBG1hsvE4ANoVczeLRBjorb7AVe18V4EnouBxfJ2ErgiM2J9SC'
//     },
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json'
//     }
//   })
//   return JSON.parse(Buffer.from(response.body).toString('utf8'))
// }

module.exports = { publishKey, checkForRoyalties }
