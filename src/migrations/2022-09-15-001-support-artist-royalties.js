
exports.up = async knex => {
  await knex.schema.createTable('royalty', table => {
    table.increments('Id')
    table.timestamps()
    table.integer('keyID').unsigned().references('keyID').inTable('key')
    table.string('referenceNumber').unique() // We need to a way to keep track of the trasaction reference number, right?
    table.integer('amount', 15)
    table.boolean('paid') // Did the artist recieve their payment? Do we need a processed field as well?
  })
  // Add an artistIdentityKey column to keep track of who owns this song
  await knex.schema.table('key', table => {
    table.string('artistIdentityKey')
  })
}

exports.down = async knex => {
  await knex.schema.table('key', table => {
    table.dropColumn('artistIdentityKey')
  })
  await knex.schema.dropTable('royalty')
}
