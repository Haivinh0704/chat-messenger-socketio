/*
https://docs.nestjs.com/modules
*/

import { DynamicModule, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GroupChatController } from '../group-chat/group-chat.controller';
import { GroupChatRepository } from '../group-chat/group-chat.repository';
import { GroupChatService } from '../group-chat/group-chat.service';
import { MessengerController } from '../messenger/messenger.controller';
import { MessengerRepository } from '../messenger/messenger.repository';
import { MessengerService } from '../messenger/messenger.service';
import { TypeOrmExModule } from '../typeorm-ex/typeorm-ex.module';
import { AuthenticationService } from './authentication.services';
import { CustomerSocketOptions } from './socket-config';
import { SocketGateway } from './socket-io.gateways';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SocketClientRepository } from '../socket-client/socket-client.repository';
import { SocketClientService } from '../socket-client/socket-client.service';

// @Module({
//     imports: [MessengerModule, GroupChatModule],
//     controllers: [],
//     providers: [SocketGateway],
// })
// export class SocketIoModule {}

@Module({})
export class SocketIoModule {
  public static CustomerOptionModule(
    option: CustomerSocketOptions,
  ): DynamicModule {
    return {
      controllers: [MessengerController, GroupChatController],
      module: SocketIoModule,
      imports: [
        JwtModule.register({
          secret: process.env.JWT_SECRET_KEY,
          signOptions: { expiresIn: process.env.JWT_EXPIRES_IN },
        }),
        EventEmitterModule.forRoot(),
        TypeOrmExModule.forCustomRepository([
          MessengerRepository,
          GroupChatRepository,
          SocketClientRepository,
        ]),
      ],
      providers: [
        {
          provide: 'CONFIG_IO_OPTION',
          useValue: option,
        },
        SocketGateway,
        MessengerService,
        GroupChatService,
        SocketClientService,
        AuthenticationService,
      ],
      exports: [SocketIoModule],
    };
  }
}
