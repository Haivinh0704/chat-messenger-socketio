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
  Messenger,
  STATUS_MESSENGER,
} from '../database/entities/messenger.entity';

import { SearchFilter } from '../common/dto/search-query';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SocketClientService } from '../socket-client/socket-client.service';
import { MessengerRepository } from '../messenger/messenger.repository';
import { SocketClientRepository } from '../socket-client/socket-client.repository';

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
    private socketClientRepository: SocketClientRepository,
  ) {}

  /**
   * TODO : get List group by id user
   * @param idUser : isUser
   * @param filter : SearchFilter
   * @returns
   */
  async getListGroup(idUser: string, filter: SearchFilter) {
    try {
      // get list groups user
      var listgroup = await this.groupChatRepository.getListGroupByIdUser(
        idUser,
        filter,
      );
      return new Promise((resolve, reject) => {
        var listFunc = [];
        listgroup.content.map((e) => {
          if (!e?.hideInListUser?.includes(idUser)) {
            listFunc.push(
              // get list Id client socket and emiter join socket
              this.socketClientService
                .getListIdClient(e.listIdUser.split(','))
                .then((res) => {
                  // if (!e.listUserMuted?.includes(idUser))
                  this.eventEmitter.emit(EMITTER_SOCKET.ONCONVER_SATION_JOIN, {
                    idGroup: e.id,
                    idClient: res,
                  });
                }),
            );
            listFunc.push(
              // get last messenger
              this.messengerRepository.findOne({
                where: {
                  group_chat_id: { id: e.id },
                  status: STATUS_MESSENGER.ACTIVE,
                },
                relations: { group_chat_id: true },
                select: {
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
              // count messenger unread
              this.messengerRepository.findMessengerUnReadByIdUser(
                idUser,
                e.id,
              ),
            );
            const idUserOther = e.listIdUser.split(',');
            listFunc.push(
              // get info User
              this._getInfoUserOther(idUserOther.find((elm) => elm !== idUser)),
            );
          }
        });

        Promise.all([...listFunc])
          .then((res) => {
            var listMessenger = [],
              listUser = [],
              listMessengerUnread = [];

            res.map((e) => {
              if (e) {
                if (e?.group_chat_id) {
                  listMessenger.push(e);
                } else if (e?.lengthMessengerUnread) {
                  listMessengerUnread.push(e);
                } else {
                  listUser.push(e);
                }
              }
            });
            var listDataConvert = [];
            [...listgroup.content].map((e) => {
              if (!e?.hideInListUser?.includes(idUser)) {
                const [
                  indexListMessenger,
                  indesListUser,
                  indexListMessengerUnread,
                ] = [
                  listMessenger.findIndex(
                    (elm) => elm.group_chat_id.id === e.id,
                  ),
                  listUser.findIndex((elm) => e.listIdUser.includes(elm.id)),
                  listMessengerUnread.findIndex((elm) => elm.idGroup === e.id),
                ];
                listDataConvert.push({
                  ...e,
                  isMute: e?.listUserMuted?.includes(idUser) ?? false,
                  messenger: listMessenger[indexListMessenger] ?? null,
                  user: listUser[indesListUser] ?? null,
                  lengthMessengerUnread:
                    listMessengerUnread[indexListMessengerUnread]
                      ?.lengthMessengerUnread ?? 0,
                });
              }
            });
            listgroup.content = listDataConvert;
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
          return listUser.map((e) => e[`${this.option.AliasIdUser}`]);
        },
      );
      return finalResult;
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
          console.log('listIdUser===========================>', listIdUser);

          const dataSave = {
            name: `${listIdUser.join('_')}_${new Date().toISOString()}`, // name group
            listIdUser: listIdUser.join(','),
            hideInListUser: null,
            listUserMuted: null,
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
          if (
            group?.hideInListUser &&
            !group?.hideInListUser?.includes(idUser)
          ) {
            const array = group.hideInListUser?.split(',');
            array.push(idUser);
            group.hideInListUser = array.join(',');
          } else if (
            !group?.hideInListUser ||
            group?.hideInListUser.trim() === ''
          ) {
            group.hideInListUser = idUser;
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
      console.log('err=============================>', error);

      throw error;
    }
  }

  muteMessenger(idGroup: string, idUser: string) {
    try {
      return new Promise((resolve, reject) => {
        Promise.all([
          this.groupChatRepository.findOne({
            where: { id: idGroup },
          }),
          this._checkListUser([idUser]),
          // this.socketClientRepository.find({
          //     where: { user_id: idUser },
          // }),
        ])
          .then(async ([group, _]) => {
            if (!group || !group.listIdUser.includes(idUser))
              throw new BadRequestException('group is not found');

            const finalResult = await this.dataSource.manager.transaction(
              async (transactionalEntityManager) => {
                if (group.listUserMuted) {
                  if (!group.listUserMuted.includes(idUser)) {
                    const array = group.listUserMuted.split(',');
                    array.push(idUser);
                    group.listUserMuted = array.join(',');
                  } else {
                    var array = group.listUserMuted.split(',');
                    const index = array.findIndex((elm) => elm === idUser);
                    array.splice(index, 1);
                    group.listUserMuted = array.join(',');
                  }
                } else {
                  group.listUserMuted = idUser;
                }

                const result = await transactionalEntityManager.save(
                  GroupChat,
                  group,
                );
                // if (group.listUserMuted.includes(idUser)) {
                //     this.eventEmitter.emit(
                //         EMITTER_SOCKET.ONCONVER_SATION_LEAVE,
                //         {
                //             idGroup: group.id,
                //             idClient: clientSocket.map(
                //                 (e) => e.id_client,
                //             ),
                //         },
                //     );
                // } else {
                //     this.eventEmitter.emit(
                //         EMITTER_SOCKET.ONCONVER_SATION_JOIN,
                //         {
                //             idGroup: group.id,
                //             idClient: clientSocket.map(
                //                 (e) => e.id_client,
                //             ),
                //         },
                //     );
                // }

                return result;
              },
            );
            return finalResult;
          })
          .then((res) => resolve(res))
          .catch((err) => reject(err));
      });
    } catch (error) {
      throw error;
    }
  }
}
