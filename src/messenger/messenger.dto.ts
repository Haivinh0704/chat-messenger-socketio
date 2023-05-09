import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class MessengerDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    content: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    group_id: string;
}

export class UpdateMessengerDto {
    @ApiProperty()
    @IsString()
    @IsOptional()
    content: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    status: number;
}

export class ResultMessengerData {
    content: string;
    id: string;
    idUser: string;
    createdOnDate: string | any;
    idGroup: string;
}
