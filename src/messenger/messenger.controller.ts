/*
https://docs.nestjs.com/controllers#controllers
*/

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticationService } from '../soket-io/authentication.services';
import { MessengerDto, UpdateMessengerDto } from './messenger.dto';
import { MessengerService } from './messenger.service';
import { SearchFilter } from '../common/dto/search-query';

@ApiTags('api/messenger')
@Controller('api/messenger')
export class MessengerController {
  constructor(
    private messengerService: MessengerService,
    private authenticationService: AuthenticationService,
  ) {}
  @Get(':id')
  @ApiOperation({ summary: 'get list messenger in group by id Group' })
  public async get(
    @Query() filter: SearchFilter,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    var idUser = await this.authenticationService.decode(
      req.headers.authorization,
    );
    return await this.messengerService.getListMessenger(filter, id, idUser);
  }

  @Post('')
  @ApiOperation({ summary: 'Create messenger id user' })
  public async create(@Body() payload: MessengerDto, @Req() req: any) {
    var idUser = await this.authenticationService.decode(
      req.headers.authorization,
    );
    return await this.messengerService.create(payload, idUser);
  }

  @Put(':id')
  @ApiOperation({ summary: 'update messenger id messenger' })
  public async update(
    @Body() payload: UpdateMessengerDto,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    var idUser = await this.authenticationService.decode(
      req.headers.authorization,
    );
    return await this.messengerService.update(payload, id, idUser);
  }
}