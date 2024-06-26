import { User } from './entities/user.entity';
import { ActivationDto, LoginDto, RegisterDto } from './dto/user.dto';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtVerifyOptions } from '@nestjs/jwt';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../../../prisma/Prisma.service';
import * as bcrypt from 'bcrypt';
import { EmailService } from './email/email.service';
import { TokenSender } from './utils/sendToken';

interface UserData {
  name: string;
  email: string;
  password: string;
  phone_number: number;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  // register user service
  async register(registerDto: RegisterDto, response: Response) {
    const { name, email, password, phone_number } = registerDto;
    //check email exit
    const isEmailExit = await this.prisma.user.findUnique({ where: { email } });
    if (isEmailExit) {
      throw new BadRequestException('Email already exist');
    }
    // check phone exit
    const isPhoneExit = await this.prisma.user.findUnique({
      where: { phone_number },
    });
    if (isPhoneExit) {
      throw new BadRequestException('Phone number already exist');
    }

    // make hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      name,
      email,
      password: hashedPassword,
      phone_number,
    };

    const activationToken = await this.createActivationToken(user);
    const activationCode = activationToken.activationCode;
    console.log(activationCode);
    await this.emailService.sendMail({
      subject: 'Activate your account !',
      template: './activation-mail',
      activationCode,
      email,
      name,
    });
    return {
      activation_token: activationToken.token,
      message: 'Otp sended to email !',
      response,
    };
  }

  // create activation token
  async createActivationToken(user: UserData) {
    // create activationCode
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

    const token = this.jwtService.sign(
      { user, activationCode },
      { secret: this.configService.get<string>('JWT_SECRET'), expiresIn: '5m' },
    );

    return { token, activationCode };
  }

  // activation user
  async activateUser(activationDto: ActivationDto, response: Response) {
    const { activationCode, activationToken } = activationDto;

    const newUser: { user: UserData; activationCode: string } =
      this.jwtService.verify(activationToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      } as JwtVerifyOptions);

    if (newUser.activationCode !== activationCode) {
      throw new BadRequestException('Invalid activation code');
    }

    const { name, email, password, phone_number } = newUser.user;

    const existUser = await this.prisma.user.findUnique({ where: { email } });
    if (existUser) {
      return new BadRequestException('User already exist with this email');
    }
    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password,
        phone_number,
      },
    });

    return { user, response };
  }

  // login user service
  async Login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (user && (await this.comparePassword(password, user.password))) {
      const tokenSender = new TokenSender(this.configService, this.jwtService);
      return tokenSender.sendToken(user);
    } else {
      return {
        user: null,
        accessToken: null,
        refreshToken: null,
        error: {
          message: 'Invalid email or password',
        },
      };
    }
  }

  // compare with hashed password
  async comparePassword(
    password: string,
    hashPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashPassword);
  }

  // get logged in user
  async getLoggedInUser(req: any) {
    const user = req.user;
    const refreshToken = req.refreshToken;
    const accessToken = req.accessToken;
    return { accessToken, refreshToken, user };
  }

  // log out user
  async Logout(req: any) {
    req.user = null;
    req.accesstoken = null;
    req.refreshtoken = null;
    return { message: 'Logged out successfully' };
  }

  // get all users service
  async getUsers() {
    return this.prisma.user.findMany({});
  }
}
