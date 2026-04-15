import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { LoginService } from '../../../core/services/login.service';
import { AuthService } from '../../../core/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    MessageModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private loginService = inject(LoginService);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  errorMessage = signal<string>('');
  loading = signal<boolean>(false);

  constructor() {
    // If already authenticated, redirect to dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const { username, password } = this.loginForm.value;

    this.loginService.login(username, password).subscribe({
      next: () => {
        this.loading.set(false);
        // Navigation handled by LoginService (D-13: redirect to /dashboard)
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 0) {
          // Network error
          this.errorMessage.set('Khong the ket noi den may chu. Vui long thu lai sau.');
        } else if (err.status === 400) {
          // OAuth2 error from /connect/token
          const desc = err.error?.error_description || '';
          if (desc.includes('khong ton tai')) {
            this.errorMessage.set('Tai khoan khong ton tai. Vui long kiem tra lai ten dang nhap.');
          } else {
            this.errorMessage.set('Mat khau khong dung. Vui long thu lai.');
          }
        } else {
          this.errorMessage.set('Khong the ket noi den may chu. Vui long thu lai sau.');
        }
      }
    });
  }
}
