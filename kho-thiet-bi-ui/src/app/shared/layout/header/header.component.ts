import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [ButtonModule, ToolbarModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  adminName = this.authService.adminName;

  // Derive page title from current route
  get pageTitle(): string {
    const path = this.router.url.split('/').pop() || 'dashboard';
    const titles: Record<string, string> = {
      'dashboard': 'Dashboard',
      'categories': 'Danh muc thiet bi',
      'suppliers': 'Nha cung cap',
      'departments': 'Phong ban',
      'equipment': 'Thiet bi',
      'employees': 'Nhan vien',
      'projects': 'Du an',
      'imports': 'Nhap kho',
      'payments': 'Thanh toan NCC',
      'assignments': 'Ban giao nhan vien',
      'allocations': 'Cap cho du an',
      'maintenance': 'Bao tri',
      'liquidations': 'Thanh ly',
      'finance': 'Tai chinh',
      'reports': 'Bao cao',
      'export': 'Xuat du lieu'
    };
    return titles[path] || 'Dashboard';
  }

  get adminInitials(): string {
    const name = this.adminName();
    if (!name) return 'A';
    return name.charAt(0).toUpperCase();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
