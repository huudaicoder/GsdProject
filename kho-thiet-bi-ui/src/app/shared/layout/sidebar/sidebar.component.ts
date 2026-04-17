import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';

export interface NavItem {
  label: string;
  icon: string;
  route?: string;
  disabled: boolean;
}

export interface NavGroup {
  label: string;
  icon: string;
  expanded: boolean;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private routerSub!: Subscription;

  // Dashboard is standalone, not inside a group
  dashboardItem: NavItem = { label: 'Dashboard', icon: 'pi pi-home', route: '/dashboard', disabled: false };

  // D-32: 5 navigation groups (Dashboard standalone + 4 collapsible groups)
  navGroups: NavGroup[] = [
    {
      label: 'Danh mục',
      icon: 'pi pi-folder-open',
      expanded: false, // D-33: closed by default
      items: [
        { label: 'Danh mục thiết bị', icon: 'pi pi-tag', route: '/categories', disabled: true },
        { label: 'Nhà cung cấp', icon: 'pi pi-building', route: '/suppliers', disabled: true },
        { label: 'Phòng ban', icon: 'pi pi-sitemap', route: '/departments', disabled: true },
        { label: 'Thiết bị', icon: 'pi pi-box', route: '/equipment', disabled: true },
        { label: 'Nhân viên', icon: 'pi pi-users', route: '/employees', disabled: true },
        { label: 'Dự án', icon: 'pi pi-briefcase', route: '/projects', disabled: true },
      ]
    },
    {
      label: 'Nhập xuất kho',
      icon: 'pi pi-arrow-right-arrow-left',
      expanded: false,
      items: [
        { label: 'Nhập kho', icon: 'pi pi-download', route: '/imports', disabled: true },
        { label: 'Thanh toán NCC', icon: 'pi pi-credit-card', route: '/payments', disabled: true },
        { label: 'Bàn giao nhân viên', icon: 'pi pi-send', route: '/assignments', disabled: true },
        { label: 'Cấp cho dự án', icon: 'pi pi-share-alt', route: '/allocations', disabled: true },
      ]
    },
    {
      label: 'Quản lý',
      icon: 'pi pi-cog',
      expanded: false,
      items: [
        { label: 'Bảo trì', icon: 'pi pi-wrench', route: '/maintenance', disabled: true },
        { label: 'Thanh lý', icon: 'pi pi-trash', route: '/liquidations', disabled: true },
      ]
    },
    {
      label: 'Thống kê',
      icon: 'pi pi-chart-bar',
      expanded: false,
      items: [
        { label: 'Tài chính', icon: 'pi pi-dollar', route: '/finance', disabled: true },
        { label: 'Báo cáo', icon: 'pi pi-chart-line', route: '/reports', disabled: true },
        { label: 'Xuất dữ liệu', icon: 'pi pi-file-export', route: '/export', disabled: true },
      ]
    }
  ];

  ngOnInit(): void {
    // D-34: Auto-expand group containing active route
    this.expandActiveGroup();

    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.expandActiveGroup();
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  toggleGroup(group: NavGroup): void {
    // Only one group open at a time
    if (group.expanded) {
      group.expanded = false;
    } else {
      this.navGroups.forEach(g => g.expanded = false);
      group.expanded = true;
    }
  }

  private expandActiveGroup(): void {
    const currentUrl = this.router.url;
    // Close all groups first, then expand the one containing active route
    this.navGroups.forEach(g => g.expanded = false);
    for (const group of this.navGroups) {
      if (group.items.some(item => item.route && currentUrl.startsWith(item.route))) {
        group.expanded = true;
        break;
      }
    }
  }
}
