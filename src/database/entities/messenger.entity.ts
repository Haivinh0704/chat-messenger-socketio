import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { GroupChat } from './group-chat.entity';
import { AbstractEntity } from '../../common/abstract/entity-app.abstract';

// status messenger
export const STATUS_MESSENGER = {
  ACTIVE: 0, // active messenger two user
  UNACTIVE: 1, // remover messenger by author
  HIDE_BY_USER: 2, // remover messenger by user other
};

@Entity('messenger')
export class Messenger extends AbstractEntity {
  @Column({ type: 'text', nullable: true })
  messenger: string;

  @Column({ type: 'text', nullable: true })
  urlMedia: string;

  @Column({ type: 'varchar', length: 50 })
  user_id: string;

  @ManyToOne(() => GroupChat, (gr) => gr.id)
  @JoinColumn({ name: 'group_chat_id' })
  @Index()
  group_chat_id: GroupChat;

  @ManyToOne(() => Messenger, { nullable: true })
  @JoinColumn({ name: 'reply' })
  reply: Messenger;

  @Column('int', { default: STATUS_MESSENGER.ACTIVE })
  status: number;

  @Column('text', { nullable: true, default: null }) // hide messenger in case the user deletes the group
  hideInListUser: string;

  @Column('text', { nullable: true, default: null })
  listUserUnRead: string;
}
