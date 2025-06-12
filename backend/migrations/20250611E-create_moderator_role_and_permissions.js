/**
 * @description Creates the moderator role, policy and permissions in the desired initial state (initial)
 * @affects directus_roles, directus_policies, directus_permissions, directus_access
 * @operation create
 */
export async function up(knex) {
    // 1. CONSTANTS
    const MODERATOR_ROLE_ID = '5d933797-c841-4c35-aa55-686e30d1e258';
    const MODERATOR_POLICY_ID = '4d933797-c841-4c35-aa55-686e30d1e258';
    const MODERATOR_ACCESS_ID = '6d933797-c841-4c35-aa55-686e30d1e258';
    // 2. VALIDATION
    const rolesTableExists = await knex.schema.hasTable('directus_roles');
    const policiesTableExists = await knex.schema.hasTable('directus_policies');
    if (!rolesTableExists || !policiesTableExists) throw new Error('Required system tables missing');
    try {
        // 3. METADATA & PERMISSIONS
        await knex('directus_policies').insert({
            id: MODERATOR_POLICY_ID,
            name: 'Moderator',
            icon: 'supervised_user_circle',
            description: 'Can moderate content and users',
            ip_access: null,
            enforce_tfa: false,
            admin_access: false,
            app_access: true
        });
        await knex('directus_roles').insert({
            id: MODERATOR_ROLE_ID,
            name: 'Moderator',
            icon: 'supervised_user_circle',
            description: 'Moderator role with content management permissions'
        });
        await knex('directus_permissions').insert([
            { collection: 'structure_posts', action: 'read', permissions: {}, validation: {}, presets: {}, fields: '*', policy: MODERATOR_POLICY_ID },
            { collection: 'structure_posts', action: 'update', permissions: {}, validation: {}, presets: {}, fields: '*', policy: MODERATOR_POLICY_ID },
            { collection: 'structure_posts', action: 'delete', permissions: {}, validation: {}, presets: {}, fields: '*', policy: MODERATOR_POLICY_ID }
        ]);
        await knex('directus_access').insert({
            id: MODERATOR_ACCESS_ID,
            role: MODERATOR_ROLE_ID,
            policy: MODERATOR_POLICY_ID,
            user: null,
            sort: 1
        });
    } catch (error) {
        throw error;
    }
}

export async function down(knex) {
    const MODERATOR_ROLE_ID = '5d933797-c841-4c35-aa55-686e30d1e258';
    const MODERATOR_POLICY_ID = '4d933797-c841-4c35-aa55-686e30d1e258';
    await knex('directus_access').where({ role: MODERATOR_ROLE_ID, policy: MODERATOR_POLICY_ID }).delete();
    await knex('directus_permissions').where({ policy: MODERATOR_POLICY_ID }).delete();
    await knex('directus_roles').where({ id: MODERATOR_ROLE_ID }).delete();
    await knex('directus_policies').where({ id: MODERATOR_POLICY_ID }).delete();
} 