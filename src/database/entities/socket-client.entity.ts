import { AbstractEntity } from '../../common/abstract/entity-app.abstract';
import { Column, Entity, JoinColumn, JoinTable, ManyToOne } from 'typeorm';

@Entity('socket-client')
export class SocketClient extends AbstractEntity {
  @Column({ type: 'varchar', length: 50 })
  user_id: string;

  @Column('varchar', {})
  id_client: string;
}
