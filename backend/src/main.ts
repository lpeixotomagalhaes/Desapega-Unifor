import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove campos não declarados nos DTOs
      transform: true, // converte tipos (ex: query string -> number)
    }),
  );

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`API rodando em http://localhost:${port}`);
}

void bootstrap();
