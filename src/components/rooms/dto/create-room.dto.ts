import { IsString, Length } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @Length(1, 50)
  name: string;

  @IsString()
  @Length(1, 30)
  nickname: string;
}
