/**
 * @description Creates the structure_posts_files junction table for linking to directus_files (initial, optimized)
 * @affects structure_posts_files, directus_collections, directus_fields
 * @operation create
 */
export async function up(knex) {
    // 1. CONSTANTS
    const TABLE = 'structure_posts_files';
    // 2. VALIDATION
    const postsTableExists = await knex.schema.hasTable('structure_posts');
    const filesTableExists = await knex.schema.hasTable('directus_files');
    if (!postsTableExists || !filesTableExists) throw new Error('Required tables missing');
    try {
        // 3. SCHEMA
        const exists = await knex.schema.hasTable(TABLE);
        if (!exists) {
            await knex.schema.createTable(TABLE, table => {
                table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
                table.uuid('structure_posts_id').references('id').inTable('structure_posts').onDelete('CASCADE').notNullable();
                table.uuid('directus_files_id').references('id').inTable('directus_files').onDelete('CASCADE').notNullable();
                table.integer('sort').nullable();
            });
        }
        // 4. METADATA
        await knex('directus_collections').insert({
            collection: TABLE,
            icon: 'import_export',
            hidden: true,
            singleton: false,
            accountability: 'all',
            collapse: 'open'
        });
        await knex('directus_fields').insert([
            { collection: TABLE, field: 'id', interface: 'input', readonly: true, hidden: true, sort: 1, width: 'full' },
            { collection: TABLE, field: 'structure_posts_id', special: ['m2o'], interface: 'select-dropdown-m2o', sort: 2, width: 'full', required: true },
            { collection: TABLE, field: 'directus_files_id', special: ['m2o'], interface: 'file', sort: 3, width: 'full', required: true },
            { collection: TABLE, field: 'sort', interface: 'input', hidden: true, sort: 4, width: 'full', required: false }
        ]);
    } catch (error) {
        if (error.code === '42P07') { console.log('Table already exists'); } else { throw error; }
    }
}

export async function down(knex) {
    await knex('directus_fields').where('collection', 'structure_posts_files').delete();
    await knex('directus_collections').where('collection', 'structure_posts_files').delete();
    await knex.schema.dropTable('structure_posts_files');
} 