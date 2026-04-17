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
      'categories': 'Danh mục thiết bị',
      'suppliers': 'Nhà cung cấp',
      'departments': 'Phòng ban',
      'equipment': 'Thiết bị',
      'employees': 'Nhân viên',
      'projects': 'Dự án',
      'imports': 'Nhập kho',
      'payments': 'Thanh toán NCC',
      'assignments': 'Bàn giao nhân viên',
      'allocations': 'Cấp cho dự án',
      'maintenance': 'Bảo trì',
      'liquidations': 'Thanh lý',
      'finance': 'Tài chính',
      'reports': 'Báo cáo',
      'export': 'Xuất dữ liệu'
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
