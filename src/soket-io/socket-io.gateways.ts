import { Inject } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ResultMessengerData } from '../messenger/messenger.dto';
import {
  CustomerSocketOptions,
  EMITTER_SOCKET,
  OPTION_SUBSCRIP,
} from './socket-config';

/**
 * @Client listen event :
 * - REC_MESSENGER: 'recMessage',               : messenger send to room id
 * - MESSENGER_ERR: 'failderMessenger',         : messenger send fail to room
 * - RESULT_LEAVE_GROUP: 'resultLeaveGroup',    : user leave room
 * - RESULT_JOIN_GROUP: 'resultJoinGroup',      : user join room
 *
 * @Server listen event :
 * START_NAME_GROUP: 'conversation-',           : name room
 */

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true
  },
  transports: ['websocket','polling'],
  path:'/message/'
  // add more option //https://socket.io/docs/v4/server-options/
})
export class SocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  constructor(
    @Inject('CONFIG_IO_OPTION')
    private option: CustomerSocketOptions,
    private eventEmitter: EventEmitter2,
  ) {}
  @WebSocketServer()
  server: Server;

  /**
   * TODO : Detect client connect to server socket
   * Log : id socket client and time connect
   * @param socket : Socket
   * @param args : any[]
   */
  handleConnection(socket: Socket, ...args: any[]) {
    console.log(
      `Incoming Connection id Socket client : ${
        socket.id
      } ======= time Connect : ${new Date().toISOString()}`,
    );
    this.eventEmitter.emit(EMITTER_SOCKET.ONCONNECT_SOCKET, {
      token: socket.handshake.auth.token,
      idClient: socket.id,
    });
    socket.emit('connected', {});
  }

  /**
   * TODO : Detect client disconnect to server socket
   * Log : id socket client and time disconnect
   * @param socket : Socket
   */
  handleDisconnect(socket: Socket) {
    console.log(
      `handleDisconnect id socket client : ${
        socket.id
      }======== time disconnect : ${new Date().toISOString()}`,
    );
    this.eventEmitter.emit(EMITTER_SOCKET.ONDISCONNECT_SOCKET, {
      idClient: socket.id,
    });
  }

  /**
   * TODO : Detect after init server socket io
   * Log : time init socket io
   * @param server : server socket io
   */
  afterInit(server: Server) {
    console.log(
      `init server socket success : ${new Date().toISOString()} ===================`,
    );
  }

  /**
   * TODO : Send messenger to all user in group chat by id group
   * @param idGroup : id group chat
   * @param messenger : messenger
   */
  @OnEvent(EMITTER_SOCKET.SEND_MESSENGER)
  async handleSendMessage(messenger: ResultMessengerData) {
    try {
      console.log('idGroup=======>', messenger.idGroup);

      this.server
        .to(`${OPTION_SUBSCRIP.START_NAME_GROUP}${messenger.idGroup}`)
        .emit(OPTION_SUBSCRIP.REC_MESSENGER, messenger);
      console.log(
        `send messenger to room : ${OPTION_SUBSCRIP.START_NAME_GROUP}${messenger.idGroup} == messenger : ${messenger.content}`,
      );
    } catch (error) {
      // throw error;
      console.log('send messenger error ============>', error);
      this.server.emit(OPTION_SUBSCRIP.MESSENGER_ERR, { error: error });
    }
  }

  /**
   * TODO : update|delete messenger to all user in group chat by id group
   * @param idGroup : id group chat
   * @param messenger : messenger
   */
  @OnEvent(EMITTER_SOCKET.UPDATE_MESSENGER)
  async handleUpdateMessage(idGroup: string, messenger: ResultMessengerData) {
    try {
      this.server
        .to(`${OPTION_SUBSCRIP.START_NAME_GROUP}${idGroup}`)
        .emit(OPTION_SUBSCRIP.REC_MESSENGER, messenger);
      console.log(
        `update messenger to room : ${OPTION_SUBSCRIP.START_NAME_GROUP}${idGroup} == messenger : ${messenger.content}`,
      );
    } catch (error) {
      // throw error;
      console.log('update messenger error ============>', error);
      this.server.emit(OPTION_SUBSCRIP.MESSENGER_ERR, { error: error });
    }
  }

  /**
   * TODO : join user join to group
   * @param dataEmitterJoin : id group and list id client
   */
  @OnEvent(EMITTER_SOCKET.ONCONVER_SATION_JOIN)
  async handleSendIdGroupToClient(dataEmitterJoin: any) {
    try {
      for (let index = 0; index < dataEmitterJoin.idClient.length; index++) {
        this.server.emit(
          dataEmitterJoin.idClient[index],
          dataEmitterJoin.idGroup,
        );
      }
    } catch (error) {
      // throw error;
      console.log('update messenger error ============>', error);
      this.server.emit(OPTION_SUBSCRIP.MESSENGER_ERR, { error: error });
    }
  }

  @OnEvent(EMITTER_SOCKET.ONCONVER_SATION_LEAVE)
  async handlLeaveGroupToClient(dataEmitterLeave: any) {
    try {
      for (let index = 0; index < dataEmitterLeave.idClient.length; index++) {
        this.server.emit(
          `${EMITTER_SOCKET.ONCONVER_SATION_LEAVE}-${dataEmitterLeave.idClient[index]}`,
          dataEmitterLeave.idGroup,
        );
      }
    } catch (error) {
      // throw error;
      console.log('update messenger error ============>', error);
      this.server.emit(OPTION_SUBSCRIP.MESSENGER_ERR, { error: error });
    }
  }

  /**
   * TODO : join user in room socket by id group
   * @param client : client socket
   * @param idGroup : string
   */
  @SubscribeMessage(OPTION_SUBSCRIP.ONCONVER_SATION_JOIN)
  async onConversationJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() idGroup: string,
  ) {
    try {
      client.join(`${OPTION_SUBSCRIP.START_NAME_GROUP}${idGroup}`);
      console.log(
        `join user to room :${OPTION_SUBSCRIP.START_NAME_GROUP}${idGroup}`,
      );
    } catch (error) {
      console.log('join room error ============>', error);
      client.emit(OPTION_SUBSCRIP.RESULT_JOIN_GROUP, { idGroup: null });
    }
  }

  /**
   * TODO : leave user to group by id group
   * @param client : client socket
   * @param idGroup :idGroup
   */
  @SubscribeMessage(OPTION_SUBSCRIP.ONCONVER_SATION_LEAVE)
  async onConversationLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() idGroup: string,
  ) {
    try {
      client.leave(`${OPTION_SUBSCRIP.START_NAME_GROUP}${idGroup}`);
      client.emit(OPTION_SUBSCRIP.RESULT_LEAVE_GROUP, {
        leaveRoom: true,
      });
      console.log(
        `leave user to room :${OPTION_SUBSCRIP.START_NAME_GROUP}${idGroup}`,
      );
    } catch (error) {
      console.log('leave room error ============>', error);
      client.emit(OPTION_SUBSCRIP.RESULT_LEAVE_GROUP, {
        leaveRoom: false,
      });
    }
  }
}
