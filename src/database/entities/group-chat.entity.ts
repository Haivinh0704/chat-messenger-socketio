import { AbstractEntity } from '../../common/abstract/entity-app.abstract';
import { Column, Entity } from 'typeorm';

@Entity('group-chat')
export class GroupChat extends AbstractEntity {
  @Column('text')
  name: string;

  @Column('simple-array')
  listIdUser: string[];

  @Column('simple-array') // hide group in case the user deletes the group
  hideInListUser: string[];
}
