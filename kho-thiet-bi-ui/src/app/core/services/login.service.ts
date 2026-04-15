import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthService } from './auth.service';

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

@Injectable({ providedIn: 'root' })
export class LoginService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);

  login(username: string, password: string): Observable<TokenResponse> {
    const body = new HttpParams()
      .set('grant_type', 'password')
      .set('client_id', 'KhoThietBi_App')
      .set('client_secret', '1q2w3e*')
      .set('username', username)
      .set('password', password)
      .set('scope', 'KhoThietBi');

    return this.http.post<TokenResponse>(
      '/connect/token',
      body.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    ).pipe(
      tap(response => {
        this.authService.setAuth(response.access_token, username);
        this.router.navigate(['/dashboard']); // D-13
      })
    );
  }
}
