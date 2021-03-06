import {
  Injectable,
  CallHandler,
  NestInterceptor,
  ExecutionContext,
} from '@nestjs/common';
import { Request } from 'express';
import { unlink } from 'fs/promises';
import { getConnection } from 'typeorm';
import { catchError, Observable, tap } from 'rxjs';

@Injectable()
export class DataVocabKindleInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<unknown> {
    const request: Request = context.switchToHttp().getRequest();
    return next.handle().pipe(
      tap(() => this.vocabDbFinalize(request.file)),
      catchError((error) => {
        this.vocabDbFinalize(request.file);
        throw error;
      }),
    );
  }

  private async vocabDbFinalize(file?: Express.Multer.File): Promise<void> {
    if (!file) return;
    await Promise.all([
      unlink(file.path),
      getConnection(file.filename).close(),
    ]);
  }
}
