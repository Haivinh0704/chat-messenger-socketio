import { toPaginationResponse } from '../common/util/query-util';
import { Repository } from 'typeorm';
import { CustomRepository } from '../typeorm-ex/typeorm-ex.decorator';
import {
  Messenger,
  STATUS_MESSENGER,
} from '../database/entities/messenger.entity';
import { SearchFilter } from '../common/dto/search-query';

@CustomRepository(Messenger)
export class MessengerRepository extends Repository<Messenger> {
  public async getAllMessengerByIdGroup(
    idGroupChat: string,
    filter: SearchFilter,
    idUser :string

  ) {
    const query = this.createQueryBuilder('messenger')
      .leftJoinAndSelect('messenger.group_chat_id', 'group_chat_id')
      .leftJoinAndSelect('messenger.reply', 'reply')
      .where('messenger.group_chat_id = :idGroupChat', {
        idGroupChat: idGroupChat,
      })
      .andWhere('NOT (messenger.hideInListUser like :idUser  ) ', {
        idUser: `%${idUser}%`,
      })
      .orWhere(
        'messenger.group_chat_id = :idGroupChat AND  messenger.hideInListUser IS NULL',
        { idGroupChat: idGroupChat },
      )
      .select([
        'messenger.messenger',
        'messenger.id',
        'messenger.user_id',
        'messenger.createdOnDate',
        'messenger.status',
        'messenger.hideInListUser',
      ]);
    const result = await toPaginationResponse({
      query,
      alias: 'messenger',
      columnDirection: 'createdOnDate',
      size: filter.size,
      page: filter.page,
      sort: filter.sort || 'ascend',
    });
    result.content.reverse()
    return result;
  }

  async findMessengerUnReadByIdUser(idUser: string, idGroup: string) {
    try {
      const query = await this.createQueryBuilder('messenger')
        .leftJoinAndSelect('messenger.group_chat_id', 'group_chat_id')
        .where(`messenger.listUserUnRead like '%${idUser}%'`)

        .andWhere(
          'messenger.group_chat_id = :idGroupChat and messenger.status = :status',
          { idGroupChat: idGroup, status: STATUS_MESSENGER.ACTIVE },
        )
        .getCount();
      return { lengthMessengerUnread: query, idGroup: idGroup };
    } catch (error) {
      throw error;
    }
  }
}
