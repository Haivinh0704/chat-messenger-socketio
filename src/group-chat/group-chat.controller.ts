/*
https://docs.nestjs.com/controllers#controllers
*/

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Put,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticationService } from '../soket-io/authentication.services';
import { GroupChatDto } from './group-chat.dto';
import { GroupChatService } from './group-chat.service';
import { SearchFilter } from '../common/dto/search-query';

@ApiTags('api/group-user')
@Controller('api/group-user')
export class GroupChatController {
  constructor(
    private groupChatService: GroupChatService,
    private authenticationService: AuthenticationService,
  ) {}

  @Get('')
  @ApiOperation({ summary: 'get list group chat' })
  public async get(@Req() req: any, @Query() filter: SearchFilter) {
    var idUser = await this.authenticationService.decode(
      req.headers.authorization,
    );
    return await this.groupChatService.getListGroup(idUser, filter);
  }

  @Post('')
  @ApiOperation({ summary: 'Create group chat by list id user' })
  public async create(@Body() payload: GroupChatDto, @Req() req: any) {
    var idUser = await this.authenticationService.decode(
      req.headers.authorization,
    );
    return await this.groupChatService.createGroup(payload.listIdUser, idUser);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mute Messenger in groups' })
  public async muteMessenger(@Param('id') id: string, @Req() req: any) {
    var idUser = await this.authenticationService.decode(
      req.headers.authorization,
    );
    return await this.groupChatService.muteMessenger(id, idUser);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'delete group chat by  id group' })
  public async delelte(@Param('id') id: string, @Req() req: any) {
    var idUser = await this.authenticationService.decode(
      req.headers.authorization,
    );
    return await this.groupChatService.deleteGroup(id, idUser);
  }
}
