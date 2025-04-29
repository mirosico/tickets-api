// import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// export class LoginRequest {
//   @ApiProperty({ example: 'user@example.com' })
//   email: string;

//   @ApiProperty({ example: 'password123' })
//   password: string;
// }

// export class RegisterRequest {
//   @ApiProperty({ example: 'user@example.com' })
//   email: string;

//   @ApiProperty({ example: 'password123' })
//   password: string;

//   @ApiProperty({ example: 'John Doe' })
//   name: string;

//   @ApiPropertyOptional({ example: '+380991234567' })
//   phone?: string;
// }

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}
