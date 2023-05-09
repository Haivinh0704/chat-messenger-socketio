import { SocketClient } from '../database/entities/socket-client.entity';
import { Repository } from 'typeorm';
import { CustomRepository } from '../typeorm-ex/typeorm-ex.decorator';

@CustomRepository(SocketClient)
export class SocketClientRepository extends Repository<SocketClient> {}
