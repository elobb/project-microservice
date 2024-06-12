import { UsersService } from './users.service';
import { BadRequestException, UseFilters, UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  ActivationResponse,
  LoginResponse,
  LogoutResponse,
  RegisterResponse,
} from './types/user.type';
import { ActivationDto, RegisterDto } from './dto/user.dto';
import { User } from './entities/user.entity';
import { Response } from 'express';
import { AuthGuard } from './guards/auth.guard';

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
    const { activation_token, message } = await this.userService.register(
      registerDto,
      context.res,
    );

    return { activation_token, message };
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
  @Query(() => LoginResponse)
  @UseGuards(AuthGuard)
  async getLoggedInUser(@Context() context: { req: Request }) {
    return await this.userService.getLoggedInUser(context.req);
  }
  @Query(() => LogoutResponse)
  @UseGuards(AuthGuard)
  async logOutUser(@Context() context: { req: Request }) {
    return await this.userService.Logout(context.req);
  }
}
