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
    { label: 'Tong thiet bi', icon: 'pi pi-box', value: '0' },
    { label: 'Dang ban giao', icon: 'pi pi-send', value: '0' },
    { label: 'Trong du an', icon: 'pi pi-briefcase', value: '0' },
    { label: 'Dang bao tri', icon: 'pi pi-wrench', value: '0' },
    { label: 'Gia tri ton kho', icon: 'pi pi-dollar', value: '0 d' },
  ];
}
