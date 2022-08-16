
exports.up = async knex => {
  await knex.schema.createTable('key', table => {
    table.increments('id')
    table.string('songURL')
    table.string('value')
  })
  await knex.schema.createTable('invoice', table => {
    // table.increments()
    table.increments('invoiceID')
    table.string('paymail')
    table.string('identityKey')
    table.string('referenceNumber')
    table.string('songURL')
    table.integer('amount')
  })
}

exports.down = async knex => {
  await knex.schema.dropTable('key')
  await knex.schema.dropTable('invoice')
}
