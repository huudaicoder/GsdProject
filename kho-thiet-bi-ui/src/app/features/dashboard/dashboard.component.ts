import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface KpiCard {
  label: string;
  icon: string;
  value: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  // D-36: Static KPI cards with 0 values (no API calls)
  kpiCards: KpiCard[] = [
    { label: 'Tổng thiết bị', icon: 'pi pi-box', value: '0' },
    { label: 'Đang bàn giao', icon: 'pi pi-send', value: '0' },
    { label: 'Trong dự án', icon: 'pi pi-briefcase', value: '0' },
    { label: 'Đang bảo trì', icon: 'pi pi-wrench', value: '0' },
    { label: 'Giá trị tồn kho', icon: 'pi pi-dollar', value: '0 đ' },
  ];
}
