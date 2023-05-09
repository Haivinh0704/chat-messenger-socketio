/*
https://docs.nestjs.com/providers#services
*/

import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { DataSource, Not } from 'typeorm';
import { MessengerService } from '../messenger/messenger.service';
import {
  CustomerSocketOptions,
  EMITTER_SOCKET,
} from '../soket-io/socket-config';
import { GroupChatRepository } from './group-chat.repository';
import { GroupChat } from '../database/entities/group-chat.entity';
import {
  ISREAD,
  Messenger,
  STATUS_MESSENGER,
} from '../database/entities/messenger.entity';

import { SearchFilter } from '../common/dto/search-query';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SocketClientService } from '../socket-client/socket-client.service';
import { MessengerRepository } from '../messenger/messenger.repository';

@Injectable()
export class GroupChatService {
  constructor(
    private groupChatRepository: GroupChatRepository,
    private dataSource: DataSource,
    @Inject('CONFIG_IO_OPTION')
    private option: CustomerSocketOptions,
    private messengerService: MessengerService,
    private eventEmitter: EventEmitter2,
    private socketClientService: SocketClientService,
    private messengerRepository: MessengerRepository,
  ) {}

  /**
   * TODO : get List group by id user
   * @param idUser : isUser
   * @param filter : SearchFilter
   * @returns
   */
  async getListGroup(idUser: string, filter: SearchFilter) {
    try {
      var listgroup = await this.groupChatRepository.getListGroupByIdUser(
        idUser,
        filter,
      );
      return new Promise((resolve, reject) => {
        var listFunc = [];
        listgroup.content.map((e) => {
          listFunc.push(
            this.socketClientService
              .getListIdClient(e.listIdUser)
              .then((res) => {
                this.eventEmitter.emit(EMITTER_SOCKET.ONCONVER_SATION_JOIN, {
                  idGroup: e.id,
                  idClient: res,
                });
              }),
          );
          listFunc.push(
            this.messengerRepository.findOne({
              where: {
                group_chat_id: { id: e.id },
                status: STATUS_MESSENGER.ACTIVE,
              },
              relations: { group_chat_id: true },
              select: {
                isRead: true,
                id: true,
                messenger: true,
                status: true,
                user_id: true,
                createdOnDate: true,
              },
              order: { createdOnDate: 'DESC' },
            }),
          );

          listFunc.push(
            this.messengerRepository.findAndCount({
              where: {
                group_chat_id: { id: e.id },
                user_id: Not(idUser),
                status: STATUS_MESSENGER.ACTIVE,
                isRead: ISREAD.UNREAD,
              },
              relations: { group_chat_id: true },
            }),
          );
          listFunc.push(
            this._getInfoUserOther(e.listIdUser.find((elm) => elm !== idUser)),
          );
        });
        console.log('run to func ', listFunc);

        Promise.all([...listFunc])
          .then((res) => {
            var listMessenger = [];
            var listUser = [];
            res.map((e) => {
              if (e) {
                if (!Array.isArray(e)) {
                  if (e?.group_chat_id) {
                    listMessenger.push(e);
                  } else {
                    listUser.push(e);
                  }
                } else {
                  let index = listMessenger.findIndex(
                    (elm) =>
                      elm.group_chat_id.id === e[0][0]?.group_chat_id?.id,
                  );
                  if (index !== -1)
                    listMessenger[index].lengthMessengerUnread = e[0].length;
                }
              }
            });
            var listDataConvert = [...listgroup.content].map((e) => {
              let index = listMessenger.findIndex(
                (elm) => elm.group_chat_id.id === e.id,
              );

              const i = listUser.findIndex((elm) =>
                e.listIdUser.includes(elm.id),
              );

              const param = {
                ...e,
                messenger: listMessenger[index],
                user: listUser[i],
              };
              return param;
            });
            listgroup.content = listDataConvert;
            console.log('id user===============>', idUser);

            return listgroup;
          })
          .then((res) => resolve(res))
          .catch((err) => reject(err));
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * TODO : get list User is exist
   * @param idUserOther :  id User
   * @returns  id User
   */
  async _getInfoUserOther(idUserOther: string) {
    try {
      const finalResult = await this.dataSource.manager.transaction(
        async (transactionalEntityManager) => {
          var listUser = await transactionalEntityManager
            .createQueryBuilder(this.option.EntityUser, 'user')
            .where(
              `user.${this.option.AliasIdUser} = :idUserOther`, // used entiy user import and alias id user
              { idUserOther: idUserOther },
            )
            .getOne();
          if (!idUserOther) throw new BadRequestException('user not found');
          return listUser;
        },
      );
      return finalResult;
    } catch (error) {
      throw error;
    }
  }

  /**
   * TODO : get group by id group
   * @param idGroup : id Group
   * @returns group
   */
  async getGroupById(idGroup: string) {
    try {
      var group = await this.groupChatRepository.findOne({
        where: { id: idGroup },
      });
      if (!group) throw new BadGatewayException('group not found');
      return group;
    } catch (error) {
      throw error;
    }
  }

  /**
   * TODO : get group by list id user in group
   * @param listIdUser : list Id User
   * @returns idGroup
   */
  async getGroupByListIdUser(listIdUser: string[]): Promise<string | null> {
    try {
      const group = await this.groupChatRepository.getGroupByListIdUser(
        listIdUser,
      );
      return group.id;
    } catch (error) {
      throw error;
    }
  }

  /**
   * TODO : Create group
   * check group by list id User => is exist ? group : create group
   * @param listIdUser : list id User
   * @param idUser : idUser
   * @returns : group
   */
  async createGroup(listIdUser: string[], idUser: string) {
    try {
      return new Promise((resolve, rejects) => {
        Promise.all([
          this._checkListUser([...listIdUser, idUser]),
          this.groupChatRepository.getGroupByListIdUser([
            ...listIdUser,
            idUser,
          ]),
          this.socketClientService.getListIdClient([...listIdUser, idUser]),
        ])
          .then(async ([listUser, group, listIdClient]) => [
            group ? group.id : await this.transactionCreate(listUser),
            listIdClient,
            group != null,
          ])
          .then(([group, listIdClient, isCreateGroup]) => {
            if (isCreateGroup)
              this.eventEmitter.emit(EMITTER_SOCKET.ONCONVER_SATION_JOIN, {
                idGroup: group,
                idClient: listIdClient,
              });

            resolve(group);
          })
          .catch((err) => rejects(err));
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * TODO : check list id User is exist
   * @param listIdUser : list id User
   * @returns list id User
   */
  async _checkListUser(listIdUser: string[]): Promise<string[]> {
    try {
      const finalResult = await this.dataSource.manager.transaction(
        async (transactionalEntityManager) => {
          var listUser = await transactionalEntityManager
            .createQueryBuilder(this.option.EntityUser, 'user')
            .where(
              `user.${this.option.AliasIdUser} IN (:...listIdUser)`, // used entiy user import and alias id user
              { listIdUser: listIdUser },
            )
            .getMany();
          if (listIdUser.length != listUser.length)
            throw new BadRequestException('user not found');
          return listUser.map((e) => e.id);
        },
      );
      return finalResult;
    } catch (error) {
      throw error;
    }
  }

  /**
   * TODO : Hide Group and messenger to user
   * @param idGroup : id Group
   * @param idUser : id User
   * @returns
   */
  deleteGroup(idGroup: string, idUser: string) {
    try {
      return new Promise((resolve, reject) => {
        Promise.all([this.getGroupById(idGroup), this._checkListUser([idUser])])
          .then(async ([group, _]) => {
            if (!group || !group.listIdUser.includes(idUser))
              throw new BadRequestException('group is not found');
            return Promise.all([
              this.messengerService.deleteMessengerByGroup(group, idUser),
              this.transactionDelete(group, idUser),
            ])
              .then((res) => res)
              .catch((err) => err);
          })
          .then((res) => resolve(res))
          .catch((err) => reject(err));
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * TODO : transaction Create group
   * @param listIdUser : list Id User
   * @returns group
   */
  async transactionCreate(listIdUser: string[]) {
    try {
      const finalResult = await this.dataSource.manager.transaction(
        async (transactionalEntityManager) => {
          const dataSave = {
            name: `${listIdUser.join('_')}_${new Date().toISOString()}`, // name group
            listIdUser: listIdUser,
            hideInListUser: [],
          };

          const result = await transactionalEntityManager.save(
            GroupChat,
            dataSave,
          );
          return result.id;
        },
      );
      return finalResult;
    } catch (error) {
      throw error;
    }
  }

  /**
   * TODO : transaction delete group chat
   * @param group : Group Chat
   * @returns
   */
  async transactionDelete(group: GroupChat, idUser: string) {
    try {
      const finalResult = await this.dataSource.manager.transaction(
        async (transactionalEntityManager) => {
          if (!group.hideInListUser.includes(idUser)) {
            group.hideInListUser.push(idUser);
          }
          const result = await transactionalEntityManager.save(
            GroupChat,
            group,
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
