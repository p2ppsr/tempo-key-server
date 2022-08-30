module.exports = {
  preAuthrite: [
    require('./migrate')
  ],
  postAuthrite: [
    require('./publish'),
    require('./pay'),
    require('./invoice')
  ]
}
