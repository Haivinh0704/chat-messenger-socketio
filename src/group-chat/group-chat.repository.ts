import { toPaginationResponse } from '../common/util/query-util';
import { Repository } from 'typeorm';
import { CustomRepository } from '../typeorm-ex/typeorm-ex.decorator';
import { GroupChat } from '../database/entities/group-chat.entity';
import { SearchFilter } from '../common/dto/search-query';

@CustomRepository(GroupChat)
export class GroupChatRepository extends Repository<GroupChat> {
  public async getGroupByListIdUser(listIdUser: string[]) {
    var reverseListIdUser = [...listIdUser].reverse();
    const query = this.createQueryBuilder('group')
      .where('group.listIdUser = :listIdUser', {
        listIdUser: listIdUser.join(','),
      })
      .orWhere('group.listIdUser = :listIdUserReverse', {
        listIdUserReverse: reverseListIdUser.join(','),
      });
    return await query.getOne();
  }

  public async getListGroupByIdUser(idUser: string, filter: SearchFilter) {
    const query = await this.createQueryBuilder('group').where(
        'group.listIdUser like :idUser',
        { idUser: `%${idUser}%` },
    );

    const result = toPaginationResponse({
        query,
        alias: 'group',
        columnDirection: 'createdOnDate',
        size: filter.size,
        page: filter.page,
        sort: filter.sort || undefined,
    });
    return await result;
}
}
