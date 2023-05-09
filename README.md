<h1 align="center"></h1>

<div align="center">
  <a href="http://nestjs.com/" target="_blank">
    <img src="https://nestjs.com/img/logo_text.svg" width="150" alt="Nest Logo" />
  </a>
</div>

<h3 align="center">NestJS npm Package Chat Messenger</h3>

<div align="center">
  <a href="https://nestjs.com" target="_blank">
    <img src="https://img.shields.io/badge/built%20with-NestJs-red.svg" alt="Built with NestJS">
  </a>
</div>

### Required

- Swagger UI
- Typeorm
- Database sql ( mysql, postgresql )

### Installation

install package :

```bash
  npm i @haivinh/chat-messenger
```

import package :

```bash
  import * as haivinh from '@haivinh/chat-messenger/dist';
```

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
    entities: ['./**/*.entity.js', Messenger, GroupChat,SocketClient],
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

### Setup Front-end

### REQUIRED socket io Front-End :

add to option socketio front-end

- transports : ['websocket'];
- URL : domain backend;
- auth : token user login

```bash
Eample :
const URL = "http://localhost:4000";
export const socket = io(URL, {
  transports: ["websocket"],
  autoConnect: false,
  auth: { token: `Bearer ${localStorage.getItem("token")}` }
});
```

in App.js you can connect socket io and listen event socket

- recMessage : user send messenger to room
- resultMessengerFailder : user send messenger falider
- #socket.id drag the user into a room

```bash
Example :
const initSocket = async () => {
    await socket.connect();
    var socketId = socket.connect().id;
    console.log("socket id connect to server ======>",socketId);

    socket.on(socketId, (idGroup) => {
      console.log(`${socket.id} go to room =====>`, idGroup);
      socket.emit("onConversationJoin", idGroup);
    });

    socket.on("recMessage", (messenger) => {
      console.log("recMessage ==================>", messenger);
      setMessenger(null);
      _addMessenger(messenger);
    });

    socket.on("resultMessenger", (data) => {
      console.log("resultMessengerFailder ==================>", data);
      if (!data.content) notification("fail to messenger");
    });
  };
```

## Change Log

See [Changelog](./CHANGELOG.md) for more information.

## giturl :

https://github.com/Haivinh0704/chat-messenger-socketio

## npm :

https://www.npmjs.com/package/@haivinh/chat-messenger

## License

Licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
