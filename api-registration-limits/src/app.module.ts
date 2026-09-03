import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env', // Aponta para o .env central da raiz
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
