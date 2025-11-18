import path from 'path';

export default ({ env }) => {
  const client = env('DATABASE_CLIENT', 'postgres');

  const connections = {
    postgres: {
      connection: {
        host: env('DATABASE_HOST', 'dgpgasia.postgres.database.azure.com'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'beta-strapi'),
        user: env('DATABASE_USERNAME', 'designgenie'),
        password: env('DATABASE_PASSWORD', 'dgflask123!'),
        ssl: {
          rejectUnauthorized: false, // Azure requires SSL but self-signed certs need this
        },
        schema: env('DATABASE_SCHEMA', 'public'),
      },
      pool: { min: env.int('DATABASE_POOL_MIN', 2), max: env.int('DATABASE_POOL_MAX', 10) },
    },
    sqlite: {
      connection: {
        filename: path.join(__dirname, '..', '..', env('DATABASE_FILENAME', '.tmp/data.db')),
      },
      useNullAsDefault: true,
    },
  };

  return {
    connection: {
      client,
      ...connections[client],
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
    },
  };
};
