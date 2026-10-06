import { IsString, Length } from 'class-validator';
import { ROOM_CODE_LENGTH } from '../../../utils/code-generator';

export class JoinRoomDto {
  @IsString()
  @Length(ROOM_CODE_LENGTH, ROOM_CODE_LENGTH)
  code: string;

  @IsString()
  @Length(1, 30)
  nickname: string;
}
