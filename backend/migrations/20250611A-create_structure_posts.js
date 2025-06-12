/**
 * @description Creates the structure_posts table with all fields, metadata and default permissions in the desired initial state
 * @affects structure_posts, directus_collections, directus_fields, directus_permissions
 * @operation create
 */
export async function up(knex) {
    // 1. CONSTANTS
    const COLLECTION_NAME = 'structure_posts';
    // 2. VALIDATION
    const usersTableExists = await knex.schema.hasTable('directus_users');
    if (!usersTableExists) throw new Error('directus_users missing');
    try {
        // 3. SCHEMA
        const exists = await knex.schema.hasTable(COLLECTION_NAME);
        if (!exists) {
            await knex.schema.createTable(COLLECTION_NAME, table => {
                table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
                table.string('status').defaultTo('draft').notNullable();
                table.string('title').notNullable();
                table.text('description').nullable();
                table.boolean('archived').defaultTo(false);
                table.uuid('user_created').references('id').inTable('directus_users').notNullable();
                table.uuid('user_updated').references('id').inTable('directus_users').notNullable();
                table.timestamp('date_created').defaultTo(knex.fn.now()).notNullable();
                table.timestamp('date_updated').defaultTo(knex.fn.now()).notNullable();
            });
        }
        // 4. METADATA
        await knex('directus_collections').insert({
            collection: COLLECTION_NAME,
            icon: 'topic',
            hidden: false,
            singleton: false,
            archive_field: null,
            archive_app_filter: true,
            archive_value: null,
            unarchive_value: null,
            accountability: 'all',
            collapse: 'open'
        });
        await knex('directus_fields').insert([
            { collection: COLLECTION_NAME, field: 'id', interface: 'input', readonly: true, hidden: true, sort: 1, width: 'full' },
            { collection: COLLECTION_NAME, field: 'status', interface: 'select-dropdown', options: { choices: [ { text: 'Draft', value: 'draft' }, { text: 'Published', value: 'published' }, { text: 'Hidden', value: 'hidden' } ] }, display: 'labels', sort: 2, width: 'full', required: true },
            { collection: COLLECTION_NAME, field: 'title', interface: 'input', sort: 3, width: 'full', required: true },
            { collection: COLLECTION_NAME, field: 'description', interface: 'input-rich-text-md', sort: 4, width: 'full' },
            { collection: COLLECTION_NAME, field: 'archived', interface: 'boolean', hidden: true, sort: 99, width: 'full' },
            { collection: COLLECTION_NAME, field: 'user_created', special: ['user-created'], interface: 'select-dropdown-m2o', display: 'user', readonly: false, hidden: true, sort: 5, width: 'half', required: false },
            { collection: COLLECTION_NAME, field: 'user_updated', special: ['user-updated'], interface: 'select-dropdown-m2o', display: 'user', readonly: false, hidden: true, sort: 6, width: 'half', required: false },
            { collection: COLLECTION_NAME, field: 'date_created', special: ['date-created'], interface: 'datetime', display: 'datetime', display_options: { relative: true }, readonly: true, hidden: true, sort: 7, width: 'half', required: true },
            { collection: COLLECTION_NAME, field: 'date_updated', special: ['date-updated'], interface: 'datetime', display: 'datetime', display_options: { relative: true }, readonly: true, hidden: true, sort: 8, width: 'half', required: true }
        ]);
        // 5. PERMISSIONS (placeholder, adjust if needed)
        // await knex('directus_permissions').insert(...);
    } catch (error) {
        if (error.code === '42P07') { console.log('Table already exists'); } else { throw error; }
    }
}

export async function down(knex) {
    await knex('directus_fields').where('collection', 'structure_posts').delete();
    await knex('directus_collections').where('collection', 'structure_posts').delete();
    await knex.schema.dropTable('structure_posts');
} 