import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty } from 'class-validator';

export class GroupChatDto {
    @ApiProperty({ isArray: true })
    @IsArray()
    @IsNotEmpty()
    listIdUser: string[];
}
