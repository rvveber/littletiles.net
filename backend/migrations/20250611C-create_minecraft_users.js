/**
 * @description Creates the minecraft_users table with all fields and metadata in the desired initial state
 * @affects minecraft_users, directus_collections, directus_fields
 * @operation create
 */
export async function up(knex) {
    // 1. CONSTANTS
    const COLLECTION_NAME = 'minecraft_users';
    // 2. VALIDATION
    // no dependencies
    try {
        // 3. SCHEMA
        const exists = await knex.schema.hasTable(COLLECTION_NAME);
        if (!exists) {
            await knex.schema.createTable(COLLECTION_NAME, table => {
                table.uuid('uuid').primary();
                table.string('gamertag').notNullable().unique();
                table.string('skin_texture').nullable();
                table.timestamp('date_created').defaultTo(knex.fn.now());
                table.timestamp('date_updated').defaultTo(knex.fn.now());
            });
        }
        // 4. METADATA
        await knex('directus_collections').insert({
            collection: COLLECTION_NAME,
            icon: 'accessibility',
            hidden: false,
            singleton: false,
            accountability: 'all',
            collapse: 'open'
        });
        await knex('directus_fields').insert([
            { collection: COLLECTION_NAME, field: 'uuid', interface: 'input', sort: 1, width: 'full', required: true },
            { collection: COLLECTION_NAME, field: 'gamertag', interface: 'input', sort: 2, width: 'full', required: true, note: 'The Minecraft username of the player' },
            { collection: COLLECTION_NAME, field: 'skin_texture', interface: 'input', sort: 3, width: 'full', required: false, hidden: true },
            { collection: COLLECTION_NAME, field: 'date_created', special: ['date-created'], interface: 'datetime', display: 'datetime', display_options: { relative: true }, readonly: true, hidden: true, sort: 4, width: 'half', required: false },
            { collection: COLLECTION_NAME, field: 'date_updated', special: ['date-updated'], interface: 'datetime', display: 'datetime', display_options: { relative: true }, readonly: true, hidden: true, sort: 5, width: 'half', required: false }
        ]);
    } catch (error) {
        if (error.code === '42P07') { console.log('Table already exists'); } else { throw error; }
    }
}

export async function down(knex) {
    await knex('directus_fields').where('collection', 'minecraft_users').delete();
    await knex('directus_collections').where('collection', 'minecraft_users').delete();
    await knex.schema.dropTable('minecraft_users');
} 