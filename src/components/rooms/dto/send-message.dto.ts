import { IsString, Length } from 'class-validator';
import { ROOM_CODE_LENGTH } from '../../../utils/code-generator';

export class SendMessageDto {
  @IsString()
  @Length(ROOM_CODE_LENGTH, ROOM_CODE_LENGTH)
  code: string;

  @IsString()
  @Length(1, 1000)
  content: string;
}
