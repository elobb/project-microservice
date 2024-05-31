import { UsersService } from './users.service';
import { BadRequestException, UseFilters } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  ActivationResponse,
  LoginResponse,
  RegisterResponse,
} from './types/user.type';
import { ActivationDto, RegisterDto } from './dto/user.dto';
import { User } from './entities/user.entity';
import { Response } from 'express';

@Resolver('User')
// @UseFilters
export class UserResolver {
  constructor(private readonly userService: UsersService) {}
  @Mutation(() => RegisterResponse)
  async register(
    @Args('registerDto') registerDto: RegisterDto,
    @Context() context: { res: Response },
  ): Promise<RegisterResponse> {
    if (!registerDto.name || !registerDto.email || !registerDto.password) {
      throw new BadRequestException('Please fill the all fields');
    }
    const { activation_token } = await this.userService.register(
      registerDto,
      context.res,
    );

    return { activation_token };
  }

  @Mutation(() => ActivationResponse)
  async activateUser(
    @Args('activationDto') activationDto: ActivationDto,
    @Context() context: { res: Response },
  ): Promise<ActivationResponse> {
    const { user } = await this.userService.activateUser(
      activationDto,
      context.res,
    );

    return { user };
  }
  @Mutation(() => LoginResponse)
  async Login(
    @Args('email') email: string,
    @Args('password') password: string,
  ): Promise<LoginResponse> {
    return await this.userService.Login({
      email,
      password,
    });
  }
  @Query(() => [User])
  async getUsers() {
    return this.userService.getUsers();
  }
}
