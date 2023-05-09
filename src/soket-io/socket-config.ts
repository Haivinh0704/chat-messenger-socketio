// import {
//     DynamicModule,
//     ForwardReference,
//     Provider,
//     Type,
// } from '@nestjs/common';

import {
  CanActivate,
  DynamicModule,
  ForwardReference,
  NestInterceptor,
  Type,
} from '@nestjs/common';
import { EntityTarget, ObjectLiteral } from 'typeorm';

export interface CustomerSocketOptions {
  // subscribeMessenger: SubScribeMessengerOption;
  // optionFunction: OptionFunctionSocketIO;

  // emiter: SubScribeMessengerOption;
  AliasIdUser: string;
  EntityUser: Function;
  AliasIdInJWTToken: string;
}

// // Subscribe Messenger in Socket io
// export class SubScribeMessengerOption {
//     sendMessenger: string | null;
//     resultMessenger: string | null;
//     onConverSationJoin: string | null;
//     onConversationLeave: string | null;
//     resultJoinGroup: string | null;
//     startNameGroup: string | null;
// }

// // option func logic in socket io
// export class OptionFunctionSocketIO {
//     messengerServices: Type<any>;
//     groupChatServices: Type<any>;
//     // sendMessenger: (...args: any) => object ;
//     // sendMessenger: (...args: any) => Promise<any>;
//     // onConverSationJoin: (...args: any) => string;
//     // onConverSationLeave: (...args: any) => boolean;
// }

export const OPTION_SUBSCRIP = {
  SEND_MESSENGER: 'sendMessage',
  UPDATE_MESSENGER: 'updateMessenger',
  REC_MESSENGER: 'recMessage',
  MESSENGER_ERR: 'failderMessenger',
  ONCONVER_SATION_JOIN: 'onConversationJoin',
  ONCONVER_SATION_LEAVE: 'onConversationLeave',
  RESULT_JOIN_GROUP: 'resultJoinGroup',
  RESULT_LEAVE_GROUP: 'resultLeaveGroup',
  START_NAME_GROUP: 'conversation-',
  JOINGROUP: 'joinInGroup',
  LEAVEGROUP: 'leaveGroup',
};

export const EMITTER_SOCKET = {
  SEND_MESSENGER: 'msg.sent',
  UPDATE_MESSENGER: 'msg.update',
  ONCONVER_SATION_JOIN: 'msg.createRoom',
  ONCONVER_SATION_LEAVE: 'msg.leaveRoom',
  ONCONNECT_SOCKET: 'msg.connect',
  ONDISCONNECT_SOCKET: 'msg.disconnect',
};
