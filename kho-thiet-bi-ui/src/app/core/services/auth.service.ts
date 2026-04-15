import { Injectable, signal, computed, effect } from '@angular/core';

export interface AuthState {
  token: string | null;
  adminName: string;
  isAuthenticated: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'access_token';
  private readonly ADMIN_NAME_KEY = 'admin_name';

  private _state = signal<AuthState>({
    token: localStorage.getItem(this.TOKEN_KEY),
    adminName: localStorage.getItem(this.ADMIN_NAME_KEY) ?? '',
    isAuthenticated: this.checkTokenValidity(localStorage.getItem(this.TOKEN_KEY))
  });

  readonly token = computed(() => this._state().token);
  readonly adminName = computed(() => this._state().adminName);
  readonly isAuthenticated = computed(() => this._state().isAuthenticated);

  constructor() {
    effect(() => {
      const state = this._state();
      if (state.token) {
        localStorage.setItem(this.TOKEN_KEY, state.token);
        localStorage.setItem(this.ADMIN_NAME_KEY, state.adminName);
      } else {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.ADMIN_NAME_KEY);
      }
    });
  }

  private checkTokenValidity(token: string | null): boolean {
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  setAuth(token: string, adminName: string): void {
    localStorage.setItem(this.ADMIN_NAME_KEY, adminName);
    this._state.set({ token, adminName, isAuthenticated: true });
  }

  logout(): void {
    this._state.set({ token: null, adminName: '', isAuthenticated: false });
  }
}
