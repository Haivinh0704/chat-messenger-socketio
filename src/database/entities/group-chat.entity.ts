import { AbstractEntity } from '../../common/abstract/entity-app.abstract';
import { Column, Entity } from 'typeorm';

@Entity('group-chat')
export class GroupChat extends AbstractEntity {
  @Column('text')
  name: string;

  @Column('varchar', { nullable: true })
  title: string;

  @Column('text', { nullable: true, default: null })
  listIdUser: string;

  @Column('text', { nullable: true, default: null }) // hide group in case the user deletes the group
  hideInListUser: string;

  @Column('text', { nullable: true, default: null }) // hide group in case the user mute notification the group
  listUserMuted: string;
}
