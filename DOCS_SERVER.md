### SETUP BACKEND

In file "app.module.ts" import socket io to module :

- 3 way :
  - AliasIdInJWTToken : alias id user in jwt token
  - AliasIdUser : alias column id user
  - EntityUser : entities user in project

```bash
Example:
    haivinh.SocketIoModule.CustomerOptionModule({
            AliasIdInJWTToken: 'id',
            AliasIdUser: 'user_id',
            EntityUser: User,
        }),
```

In DataSourceOptions config ( data-source in project ):

- add entity Messenger and GropChat after path entiy

```bash
Example:
  export const dataSource: DataSourceOptions = {
    type: 'postgres',
    host: process.env.TYPEORM_HOST || 'localhost',
    port: +process.env.TYPEORM_PORT || 3306,
    username: process.env.TYPEORM_USERNAME || 'root',
    password: process.env.TYPEORM_PASSWORD || '123456',
    database: process.env.TYPEORM_DATABASE || 'databasename',
    entities: ['./**/*.entity.js', Messenger, GroupChat],
    migrations: ['../../dist/database/migrations/*.{ts,js}'],
    synchronize: process.env.TYPEORM_SYNCHRONIZE === 'true',
    logging: process.env.TYPEORM_LOGGING === 'true',
};

```

migration:generate ( create new migration compatible table in project )

```bash
    "typeorm-generate": "node --require ts-node/register ./node_modules/typeorm/cli.js -d ./typeorm-datasource.ts migration:generate src/database/migrations/newmigration",
```

run migration: migration:run
example :

```bash
    "typeorm-run": "node --require ts-node/register ./node_modules/typeorm/cli.js -d ./typeorm-datasource.ts migration:run",
```
