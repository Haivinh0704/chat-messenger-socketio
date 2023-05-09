/*
https://docs.nestjs.com/providers#services
*/

import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SocketClient } from '../database/entities/socket-client.entity';
import { DataSource, In } from 'typeorm';
import { AuthenticationService } from '../soket-io/authentication.services';
import {
  CustomerSocketOptions,
  EMITTER_SOCKET,
} from '../soket-io/socket-config';
import { SocketClientRepository } from './socket-client.repository';

@Injectable()
export class SocketClientService {
  constructor(
    private socketClientRepository: SocketClientRepository,
    private dataSource: DataSource,
    @Inject('CONFIG_IO_OPTION')
    private option: CustomerSocketOptions,
    private authenticationService: AuthenticationService,
  ) {}

  @OnEvent(EMITTER_SOCKET.ONCONNECT_SOCKET)
  async connectSocketClient(dataConnet: any) {
    console.log('run to connection=========================>', dataConnet);
    var idUser = await this.authenticationService.decode(dataConnet.token);
    try {
      await this._checkUser(idUser);
      return await this.transactionCreate(dataConnet.idClient, idUser);
    } catch (error) {
      throw error;
    }
  }

  @OnEvent(EMITTER_SOCKET.ONDISCONNECT_SOCKET)
  async disconnectSocketClient(dataConnet: any) {
    console.log(
      'run to disconnect=========================>',
      dataConnet.idClient,
    );
    try {
      return await this.transactionDisconnect(dataConnet.idClient);
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
   * TODO : save token id client
   * @param idClient : string
   * @param user_id : string
   * @returns
   */
  async transactionCreate(idClient: string, idUser: string) {
    try {
      const finalResult = await this.dataSource.manager.transaction(
        async (transactionalEntityManager) => {
          const dataSave = {
            user_id: idUser,
            id_client: idClient,
          };

          const result = await transactionalEntityManager.save(
            SocketClient,
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

  async transactionDisconnect(idClient: string) {
    try {
      const finalResult = await this.dataSource.manager.transaction(
        async (transactionalEntityManager) => {
          const client = await transactionalEntityManager.findOne(
            SocketClient,
            { where: { id_client: idClient } },
          );

          if (!client) return 'client not found';
          const result = await transactionalEntityManager.delete(
            SocketClient,
            client,
          );

          return result;
        },
      );
      return finalResult;
    } catch (error) {
      throw error;
    }
  }

  async getListIdClient(listIdUser: string[]) {
    try {
      return await this.socketClientRepository
        .find({
          where: { user_id: In(listIdUser) },
          select: { id_client: true },
        })
        .then((res) => res.map((e) => e.id_client));
    } catch (error) {
      throw error;
    }
  }
}
