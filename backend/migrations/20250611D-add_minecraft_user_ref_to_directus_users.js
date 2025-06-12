/**
 * @description Adds the minecraft_user reference field to directus_users (initial, optimized, now with ON DELETE SET NULL)
 * @affects directus_users, directus_fields
 * @operation add
 */
export async function up(knex) {
    // 1. VALIDATION
    const usersTableExists = await knex.schema.hasTable('directus_users');
    const mcTableExists = await knex.schema.hasTable('minecraft_users');
    if (!usersTableExists || !mcTableExists) throw new Error('Required tables missing');
    try {
        // 2. SCHEMA
        // Remove existing FK if present (for reruns or migration fixes)
        const fkExists = await knex.raw(`SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'directus_users' AND constraint_type = 'FOREIGN KEY' AND constraint_name = 'directus_users_minecraft_user_foreign'`);
        if (fkExists.rows && fkExists.rows.length > 0) {
            await knex.schema.alterTable('directus_users', table => {
                table.dropForeign('minecraft_user');
            });
        }
        // Drop column if exists (for idempotency)
        const columns = await knex('information_schema.columns').where({ table_name: 'directus_users', column_name: 'minecraft_user' });
        if (columns.length > 0) {
            await knex.schema.alterTable('directus_users', table => {
                table.dropColumn('minecraft_user');
            });
        }
        // Add column and FK with ON DELETE SET NULL
        await knex.schema.alterTable('directus_users', table => {
            table.uuid('minecraft_user').nullable();
        });
        await knex.schema.alterTable('directus_users', table => {
            table.foreign('minecraft_user').references('uuid').inTable('minecraft_users').onDelete('SET NULL');
        });
        // 3. METADATA
        const fieldExists = await knex('directus_fields').where({ collection: 'directus_users', field: 'minecraft_user' });
        if (fieldExists.length === 0) {
            await knex('directus_fields').insert({
                collection: 'directus_users',
                field: 'minecraft_user',
                interface: 'select-dropdown-m2o',
                special: ['m2o'],
                display: 'user',
                width: 'full',
                sort: 100,
                required: false
            });
        }
    } catch (error) {
        if (error.code === '42P07') { console.log('Field already exists'); } else { throw error; }
    }
}

export async function down(knex) {
    await knex('directus_fields').where({ collection: 'directus_users', field: 'minecraft_user' }).delete();
    await knex.schema.alterTable('directus_users', table => {
        table.dropForeign('minecraft_user');
        table.dropColumn('minecraft_user');
    });
} 