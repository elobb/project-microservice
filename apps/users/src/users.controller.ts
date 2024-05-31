import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // @Get()
  // getHello() {
  //   return this.usersService.createActivationToken({
  //     name: 'anis',
  //     email: 'ani@gmail.com',
  //     phone_number: 54545454,
  //     password: '444448d87d8df',
  //   });
  // }
}
