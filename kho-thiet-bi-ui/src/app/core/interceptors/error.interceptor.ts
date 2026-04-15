import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const messageService = inject(MessageService);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Skip 401 handling for login requests (those return 400 not 401)
      if (error.status === 401 && !req.url.includes('/connect/token')) {
        // D-35: Session expired toast + 3s redirect
        messageService.add({
          severity: 'warn',
          summary: 'Het phien',
          detail: 'Phien dang nhap da het han. Vui long dang nhap lai.',
          sticky: true, // non-dismissible per UI-SPEC
          key: 'session-expired'
        });
        setTimeout(() => {
          authService.logout();
          router.navigate(['/login']);
        }, 3000);
      } else if (error.status === 403) {
        // 403: Forbidden toast, no redirect
        messageService.add({
          severity: 'error',
          summary: 'Khong co quyen',
          detail: 'Ban khong co quyen thuc hien thao tac nay.',
          life: 6000
        });
      }
      return throwError(() => error);
    })
  );
};
