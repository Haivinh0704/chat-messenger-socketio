/*
https://docs.nestjs.com/providers#services
*/

import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { DataSource, Not } from 'typeorm';
import { GroupChatRepository } from '../group-chat/group-chat.repository';
import {
  CustomerSocketOptions,
  EMITTER_SOCKET,
} from '../soket-io/socket-config';
import {
  MessengerDto,
  ResultMessengerData,
  UpdateMessengerDto,
} from './messenger.dto';
import { MessengerRepository } from './messenger.repository';
import {
  ISREAD,
  Messenger,
  STATUS_MESSENGER,
} from '../database/entities/messenger.entity';
import { GroupChat } from '../database/entities/group-chat.entity';
import { SearchFilter } from '../common/dto/search-query';

@Injectable()
export class MessengerService {
  constructor(
    private groupChatRepository: GroupChatRepository,
    private messengerRepository: MessengerRepository,
    private dataSource: DataSource,
    @Inject('CONFIG_IO_OPTION')
    private option: CustomerSocketOptions,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * TODO : get list messenger in group || remover messenger to user delete
   * @param filter : SearchFilter
   * @param idGroup : idGroup
   * @param idUser : string
   * @returns
   */
  async getListMessenger(
    filter: SearchFilter,
    idGroup: string,
    idUser: string,
  ) {
    try {
      return new Promise((resolve, reject) => {
        Promise.all([
          this.messengerRepository.find({
            where: {
              group_chat_id: { id: idGroup },
              user_id: Not(idUser),
              status: STATUS_MESSENGER.ACTIVE,
              isRead: ISREAD.UNREAD,
            },
            relations: { group_chat_id: true },
          }),
          this.messengerRepository.getAllMessengerByIdGroup(idGroup, filter),
        ])
          .then(async ([listMessengerUnread, listMessenger]) => {
            var listData = [];
            await this.transactionReadMessegner(
              listMessengerUnread.map((e) => ({
                ...e,
                isRead: ISREAD.READ,
              })),
            );
            listMessenger.content.map((e) => {
              if (!e.hideInListUser.includes(idUser)) {
                var param = {
                  content: e.messenger,
                  id: e.id,
                  idUser: e.user_id,
                  create_at: e.createdOnDate,
                  status: e.status,
                };
                listData.push(param);
              }
            });
            return listData;
          })
          .then((res) => resolve(res))
          .catch((err) => reject(err));
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * TODO : create messenger by user
   * @param payload : MessengerDto
   * @param idUser :string
   * @returns
   */
  create(payload: MessengerDto, idUser: string) {
    try {
      return new Promise((resolve, reject) => {
        Promise.all([
          this.groupChatRepository.findOne({
            where: { id: payload.group_id },
          }),
          this._checkUser(idUser),
        ])
          .then(async ([group, user]) => {
            if (!group || !user)
              throw new BadRequestException('group not found');
            return await this.transactionCreate(payload, idUser, group);
          })
          .then((res) => resolve(res))
          .catch((err) => reject(err));
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * TODO : update Messenger
   * @param payload :UpdateMessengerDto
   * @param idMesenger :idMessenger
   * @param idUser : id User
   * @returns
   */
  async update(
    payload: UpdateMessengerDto,
    idMesenger: string,
    idUser: string,
  ) {
    try {
      const messenger = await this.messengerRepository.findOne({
        where: { id: idMesenger },
        relations: { group_chat_id: true },
      });
      const group = await this.groupChatRepository.findOne({
        where: { id: messenger.group_chat_id.id },
      });
      if (
        (payload.content && messenger.user_id != idUser) ||
        (payload.status != STATUS_MESSENGER.HIDE_BY_USER &&
          messenger.user_id != idUser) ||
        !group.listIdUser.includes(idUser)
      )
        throw new BadRequestException('user not permission');

      return await this.transactionUpdateMessenger(messenger, payload, idUser);
    } catch (error) {
      throw error;
    }
  }

  /**
   * TODO : check id User is exist
   * @param idUser : list id User
   * @returns list id User
   */
  async _checkUser(idUser: string): Promise<boolean> {
    try {
      const finalResult = await this.dataSource.manager.transaction(
        async (transactionalEntityManager) => {
          var user = await transactionalEntityManager
            .createQueryBuilder(this.option.EntityUser, 'user')
            .where(
              `user.${this.option.AliasIdUser} = :idUSer`, // used entiy user import and alias id user
              { idUSer: idUser },
            )
            .getOne();
          if (!user) throw new BadRequestException('user not found');
          return true;
        },
      );
      return finalResult;
    } catch (error) {
      throw error;
    }
  }

  /**
   * TODO read messenger
   * @param listMessener : list messenger
   * @returns
   */
  async transactionReadMessegner(listMessener: Messenger[]) {
    try {
      const finalResult = await this.dataSource.manager.transaction(
        async (transactionalEntityManager) => {
          const result = await transactionalEntityManager.save(
            Messenger,
            listMessener,
          );

          return result;
        },
      );
      return finalResult;
    } catch (error) {
      throw error;
    }
  }

  /**
   * TODO : create new messenger by user
   * @param param : MessengerDto
   * @param user_id : string
   * @param group : GroupChat
   * @returns
   */
  async transactionCreate(
    param: MessengerDto,
    user_id: string,
    group: GroupChat,
  ) {
    try {
      const finalResult = await this.dataSource.manager.transaction(
        async (transactionalEntityManager) => {
          const dataSave = {
            messenger: param.content,
            user_id: user_id,
            group_chat_id: group,
            hideInListUser: [],
          };

          const result = await transactionalEntityManager.save(
            Messenger,
            dataSave,
          );
          var paramSendMessenger: ResultMessengerData = {
            createdOnDate: result.createdOnDate,
            id: result.id,
            content: result.messenger,
            idGroup: group.id,
            idUser: result.user_id,
          };
          this.eventEmitter.emit(
            EMITTER_SOCKET.SEND_MESSENGER,
            paramSendMessenger,
          );

          return result;
        },
      );
      return finalResult;
    } catch (error) {
      throw error;
    }
  }

  /**
   * TODO : update messenger
   * @param messenger :Messenger
   * @param payload :UpdateMessengerDto
   * @param idUser :string
   * @returns
   */
  async transactionUpdateMessenger(
    messenger: Messenger,
    payload: UpdateMessengerDto,
    idUser: string,
  ) {
    try {
      const finalResult = await this.dataSource.manager.transaction(
        async (transactionalEntityManager) => {
          var dataSave = {
            ...messenger,
          };
          if (payload.content) dataSave.messenger = payload.content;
          if (payload.status) {
            dataSave.status = payload.status;
            if (
              payload.status != STATUS_MESSENGER.HIDE_BY_USER &&
              messenger.user_id != idUser
            )
              dataSave.hideInListUser.push(idUser);
          }

          const result = await transactionalEntityManager.save(
            Messenger,
            dataSave,
          );
          return result;
        },
      );
      return finalResult;
    } catch (error) {
      throw error;
    }
  }

  /**
   * TODO : hide messenger group for user
   * @param group : GroupChat
   * @param idUser :idUSer
   * @returns
   */
  async deleteMessengerByGroup(group: GroupChat, idUser: string) {
    try {
      const finalResult = await this.dataSource.manager.transaction(
        async (transactionalEntityManager) => {
          const messengerInGroup = await transactionalEntityManager
            .find(Messenger, {
              where: { group_chat_id: { id: group.id } },
              relations: { group_chat_id: true },
            })
            .then((res) =>
              res.map((e) => {
                if (!e.hideInListUser.includes(idUser))
                  e.hideInListUser.push(idUser);
                var param = {
                  ...e,
                };

                return param;
              }),
            );

          const result = await transactionalEntityManager.save(
            Messenger,
            messengerInGroup,
          );

          return result;
        },
      );
      return finalResult;
    } catch (error) {
      throw error;
    }
  }
}
