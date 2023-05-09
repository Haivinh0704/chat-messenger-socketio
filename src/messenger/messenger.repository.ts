import { toPaginationResponse } from '../common/util/query-util';
import { Repository } from 'typeorm';
import { CustomRepository } from '../typeorm-ex/typeorm-ex.decorator';
import { Messenger } from '../database/entities/messenger.entity';
import { SearchFilter } from '../common/dto/search-query';

@CustomRepository(Messenger)
export class MessengerRepository extends Repository<Messenger> {
  public async getAllMessengerByIdGroup(
    idGroupChat: string,
    filter: SearchFilter,
  ) {
    const query = this.createQueryBuilder('messenger')
      .leftJoinAndSelect('messenger.group_chat_id', 'group_chat_id')
      .where('messenger.group_chat_id = :idGroupChat', {
        idGroupChat: idGroupChat,
      })
      .select([
        'messenger.messenger',
        'messenger.id',
        'messenger.user_id',
        'messenger.createdOnDate',
        'messenger.status',
        'messenger.hideInListUser',
      ]);
    const result = toPaginationResponse({
      query,
      alias: 'messenger',
      columnDirection: 'createdOnDate',
      size: filter.size,
      page: filter.page,
      sort: filter.sort || 'ascend',
    });
    return await result;
  }
}
