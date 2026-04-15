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
      label: 'Danh muc',
      icon: 'pi pi-folder-open',
      expanded: false, // D-33: closed by default
      items: [
        { label: 'Danh muc thiet bi', icon: 'pi pi-tag', route: '/categories', disabled: true },
        { label: 'Nha cung cap', icon: 'pi pi-building', route: '/suppliers', disabled: true },
        { label: 'Phong ban', icon: 'pi pi-sitemap', route: '/departments', disabled: true },
        { label: 'Thiet bi', icon: 'pi pi-box', route: '/equipment', disabled: true },
        { label: 'Nhan vien', icon: 'pi pi-users', route: '/employees', disabled: true },
        { label: 'Du an', icon: 'pi pi-briefcase', route: '/projects', disabled: true },
      ]
    },
    {
      label: 'Nhap xuat kho',
      icon: 'pi pi-arrow-right-arrow-left',
      expanded: false,
      items: [
        { label: 'Nhap kho', icon: 'pi pi-download', route: '/imports', disabled: true },
        { label: 'Thanh toan NCC', icon: 'pi pi-credit-card', route: '/payments', disabled: true },
        { label: 'Ban giao nhan vien', icon: 'pi pi-send', route: '/assignments', disabled: true },
        { label: 'Cap cho du an', icon: 'pi pi-share-alt', route: '/allocations', disabled: true },
      ]
    },
    {
      label: 'Quan ly',
      icon: 'pi pi-cog',
      expanded: false,
      items: [
        { label: 'Bao tri', icon: 'pi pi-wrench', route: '/maintenance', disabled: true },
        { label: 'Thanh ly', icon: 'pi pi-trash', route: '/liquidations', disabled: true },
      ]
    },
    {
      label: 'Thong ke',
      icon: 'pi pi-chart-bar',
      expanded: false,
      items: [
        { label: 'Tai chinh', icon: 'pi pi-dollar', route: '/finance', disabled: true },
        { label: 'Bao cao', icon: 'pi pi-chart-line', route: '/reports', disabled: true },
        { label: 'Xuat du lieu', icon: 'pi pi-file-export', route: '/export', disabled: true },
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
