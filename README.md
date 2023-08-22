<h1 align="center"></h1>

<div align="center">
  <a href="http://nestjs.com/" target="_blank">
    <img src="https://nestjs.com/img/logo_text.svg" width="150" alt="Nest Logo" />
  </a>
</div>

<h3 align="center">NestJS npm Package Chat Messenger using socket io</h3>

<div align="center">
  <a href="https://nestjs.com" target="_blank">
    <img src="https://img.shields.io/badge/built%20with-NestJs-red.svg" alt="Built with NestJS">
  </a>
</div>

# Description :

These days nestjs and ws are also gradually developing, I have written a way to help you have the most basic chat-message, including related to messages such as send message, recall, send media, count message, ... and the basics of socket client.

=> Also you can find instructions about it on the page : https://socket.io/docs/v4/ and https://docs.nestjs.com/

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

- step import :
  - AliasIdInJWTToken : alias id user in jwt token
  - AliasIdUser : alias column id user
  - EntityUser : entities user in project
  - AliasNameUser: 'email';

```bash
Example:
    haivinh.SocketIoModule.CustomerOptionModule({
            AliasIdInJWTToken: 'id',
            AliasIdUser: 'user_id',
            EntityUser: User,
            AliasNameUser: 'email';
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
  transports: ["websocket", "polling"],
  transports: ["websocket"],
  autoConnect: false,
  path:'/message/',
  auth: { token: `Bearer ${localStorage.getItem("token")}` }
});
```

in App.js you can connect socket io and listen event socket

- recMessage : user send messenger to room
- resultMessengerFailder : user send messenger falider
- #socket.id drag the user into a room

```bash
Example :
/**
 * TODO : innit Socket and listing Event socket io
 * @param {*} setMessenger : func set Messenger
 * @param {*} addMessenger : func Add Messenger
 */
export const initSocket = async (setMessenger, addMessenger) => {
  await socket.connect();
  socket.on("recMessage", (messenger) => {
    console.log("recMessage ==================>", messenger);
    setMessenger(null);
    addMessenger(messenger);
  });

  socket.on("connect", () => {
    socket.on(socket.id, (idGroup) => {
      console.log(`${socket.id}=====================>`, idGroup);
      socket.emit("onConversationJoin", idGroup);
    });

    socket.on(`msg.leaveRoom-${socket.id}`, (idGroup) => {
      console.log(
        `${socket.id}========onConversationLeave=============>`,
        idGroup
      );
      socket.emit("onConversationLeave", idGroup);
    });
  });

  socket.on("resultMessenger", (data) => {
    if (!data.content) notification("fail to messenger");
  });
};
```

### Follow socket :

1. Start call api listGroup

```bash
API : api/group-user?page=1&size=20 || Method : GET
```

2. After getting the group id, we will pull the user into that grop using the client's socket.id

```bash
socket.on(socket.id, (idGroup) => {
  console.log(`${socket.id}=====================>`, idGroup);
  socket.emit("onConversationJoin", idGroup);
});
```

3. After dragging the client into the room, the client will receive the messenger by event recMessage,you need to check condition in recMessenger messenger for best display

```bash
socket.on("recMessage", (messenger) => {
  console.log("recMessage ==================>", messenger);
  setMessenger(null);
  addMessenger(messenger);
});
```

4. Send a message to the group, you will call

### note :

Since you will need upload management I won't interfere to best protect your privacy, I will just save urlMedia on messenger and not add anything else, retrieving sent media count is also based on go to urlMedia sent on message

```bash
API : api/messenger || Method : POST
     var param = {"content": messenger, "group_id": idGroup};
      if (replyTo != null) param['replyTo'] = replyTo;
      if (urlMedia != null) param['urlMedia'] = urlMedia;
```

5. Create and join group, you wil call

```bash
API : api/group-user || Method : POST
param = {"listIdUser": \[idUser\]}
```

6. If you want to mute a group, you'll need to call. Since it only hides notifications, notification display will need to be set up in the frontend

```bash
API : api/group-user/$idGroup || Method : PUT
```

7. If you want to delete all messages in the group, you will call. It will delete all old messages in the group for you

```bash
API : api/group-user/$idGroup || Method : DELETE
```

8. If you want to revoke or delete user messages, please call. It will change the status of messenger ( 0 : active, 1 : unactive, 2: hide by user )

```bash
API : api/messenger/$idMessenger || Method : DELETE
```

9. Get list media send to group ( option filter )

```bash
API : media-in-group/$idGroup || Method : GET
```

## Set up Adapter and middleware

# middleware socket io

create file authen-socket.ts in server

```bash
import {
    UnauthorizedException,
} from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Socket } from 'socket.io';
import { User } from 'src/database/entities/user.entity';
import { JwtService } from '@nestjs/jwt';

export interface AuthenticatedSocket extends Socket {
    user?: User;
}

export class AuthAdapter extends IoAdapter {
    createIOServer(port: number, options?: any): any {
        const server = super.createIOServer(port, { ...options, cors: true });
        //	Adds the middleware function to the websocket server.
        console.log('run to middleware ========================>');

        server.use((socket: AuthenticatedSocket, next) => {
            if (socket.handshake.auth && socket.handshake.auth.token) {
                const jwtService: JwtService = new JwtService();
                const jwt = socket.handshake.auth.token.replace('Bearer ', '');
                var data = jwtService.decode(jwt, { json: true });
                console.log(
                    'run to check authenrication ======================>',
                    socket.handshake.auth.token,
                );
                if (data) {
                    console.log('authenrication ======================>', data);
                    next();
                } else {
                    console.log(
                        'failder authenrication ======================>',
                        data,
                    );
                    next(
                        new UnauthorizedException(
                            `Authentication error ${socket.handshake.auth.token}`,
                        ),
                    );
                }
            } else {
                next(
                    new UnauthorizedException(
                        `Authentication error ${socket.handshake.auth.token}`,
                    ),
                );
            }
        });
        return server;
    }
}
```

add option in client

```bash
export const socket = io(BASEDOMAIN_SOCKETIO, {
  transports: ["websocket", "polling"],
  // upgrade:true,
  withCredentials: true,
  autoConnect: false,
  auth: { token: `Bearer ${token}` }
});
```

# RedisIoAdapter

create file redis-adapter-config.ts in server

```bash

import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  async connectToRedis(): Promise<void> {
    const pubClient = createClient({
      url: `redis://${process.env.TYPEORM_REDIS_HOST}:${process.env.TYPEORM_REDIS_PORT}`,
      password:process.env.TYPEORM_REDIS_PASSWORD.toString() || '123456'
    });

    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()])

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    console.log('server IO  ===========================>',server);
    return server;
  }
}
```

# main.ts server

add line to main.ts

```bash
    app.useWebSocketAdapter(new AuthAdapter(app)); // middleware socket adapter
    const redisIoAdapter = new RedisIoAdapter(app); // redis socket adapter
    await redisIoAdapter.connectToRedis();
    app.useWebSocketAdapter(redisIoAdapter);
```

Create

## Change Log

See [Changelog](./CHANGELOG.md) for more information.
## Support

I'm in the process of developing, looking forward to your support and contributions(https://github.com/Haivinh0704/chat-messenger-socketio/issues) Thank you

## License

Licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
