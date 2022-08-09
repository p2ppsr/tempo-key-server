
exports.up = async knex => {
  await knex.schema.createTable('key', table => {
    table.increments('keyID')
    table.timestamps()
    table.string('bridgeID')
    table.string('songID')
    table.string('value')
  })
}

exports.down = async knex => {
  await knex.schema.dropTable('key')
}
