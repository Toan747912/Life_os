import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { FocusModule } from './modules/focus/focus.module';
import { NotesModule } from './modules/notes/notes.module';
import { FlashcardsModule } from './modules/flashcards/flashcards.module';
import { UsersModule } from './modules/users/users.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { EntitiesModule } from './modules/entities/entities.module';
import { SyncModule } from './modules/sync/sync.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { LearningSessionsModule } from './modules/learning-sessions/learning-sessions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true, // Only for dev
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    TasksModule,
    FocusModule,
    NotesModule,
    FlashcardsModule,
    UsersModule,
    WorkspacesModule,
    EntitiesModule,
    SyncModule,
    ActivitiesModule,
    LearningSessionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
