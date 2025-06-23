export default async ({ action, init }, { env, services, database, getSchema, logger }) => {

	async function createInitialAdminUser() {
		const schema = await getSchema({ database });
		const { UsersService } = services;
		const usersService = new UsersService({ schema, knex: database });

		const customAdminUser = {
			id: 'f26a5b9b-8a21-4362-b318-99e4b6d3655c',
			email: 'admin@example.com',
			password: 'admin@example.com',
			token: 'admin@example.com',
			first_name: 'Admin',
			last_name: 'User',
			role: '96fe793c-a8e4-4ec4-84c1-a7f139762227',
			status: 'active',
		};

		const logUserDetails = (action) => {
			logger.info(`[DEV] Admin user ${action}!`);
			logger.info(`[DEV] E-Mail:   	${customAdminUser.email}`);
			logger.info(`[DEV] Password: 	${customAdminUser.password}`);
			logger.info(`[DEV] Token:    	${customAdminUser.token}`);
		};

		try {
			await usersService.createOne({ ...customAdminUser });
			logUserDetails('created');
		} catch (createErr) {
			try {
				await usersService.updateOne(customAdminUser.id, { ...customAdminUser });
				logUserDetails('updated');
			} catch (updateErr) {
				logger.error('[DEV] Error creating admin user:', createErr);
				logger.error('[DEV] Error updating admin user:', updateErr);
			}
		}
	}


	// schema-sync is syncing on app.before - creating roles etc.
	init('app.after', () => {
		createInitialAdminUser();
	});
};

