import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class MessengerDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  content: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  group_id: string;

  
  @ApiProperty()
  @IsString()
  @IsOptional()
  replyTo: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  urlMedia: string;
}

export class UpdateMessengerDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  content: string;
}

export class ResultMessengerData {
  content: string;
  id: string;
  idUser: string;
  createdOnDate: string | any;
  idGroup: string;
  nameUser: string;
  reply:any;
  urlMedia:string |null
}
