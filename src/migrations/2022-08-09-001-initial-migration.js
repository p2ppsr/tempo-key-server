
exports.up = async knex => {
  await knex.schema.createTable('key', table => {
    table.increments('keyID')
    table.string('songURL')
    table.string('value')
  })
}

exports.down = async knex => {
  await knex.schema.dropTable('key')
}
