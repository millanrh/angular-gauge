import { Component, signal, effect, OnDestroy, computed, viewChild, ElementRef } from '@angular/core';
import { NgxGaugeModule, NgxGauge } from 'ngx-gauge';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgxGaugeModule, FormsModule, BaseChartDirective],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent implements OnDestroy {
  gaugeValue = signal(0);
  isPaused = signal(false);

  private sub = new Subscription();
  private historicalData: number[] = [];
  private labels: string[] = [];

  public lineChartData: ChartConfiguration['data'] = {
    datasets: [{
      data: [],
      label: 'Tendencia de Velocidad',
      backgroundColor: 'rgba(33, 150, 243, 0.2)',
      borderColor: '#2196f3',
      pointBackgroundColor: '#1976d2',
      fill: 'origin',
    }],
    labels: []
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: { y: { min: 0, max: 100 } },
    animation: false // Desactivamos animación de la gráfica para mayor rendimiento en tiempo real
  };

  // Configuraciones del Gauge
  gaugeType = 'semi' as const;
  gaugeLabel = "Velocidad";
  gaugeAppendText = "km/hr";

  gaugeThresholds = {
  '0': { color: 'green' },
  '40': { color: 'orange' },
  '75': { color: 'red' }
  };

  private intervalId: any;
  
  updateManualValue(event: Event) {
  const input = event.target as HTMLInputElement;
  const valor = Number(input.value);
  if (!isNaN(valor) && valor >= 0 && valor <= 100) {
    this.isPaused.set(true);
    this.gaugeValue.set(valor);
    this.updateChart(valor); // <--- Añade esto para que la gráfica reaccione
  }
}

  public gaugeColor = computed(() => {
  const val = this.gaugeValue();
  if (val > 75) return 'red';
  if (val > 40) return 'orange';
  return 'green';
});

  constructor() {    
    this.startSimulating();
  }

  startSimulating() {
  this.sub = interval(1500).subscribe(() => {
    if (!this.isPaused()) {
      const nuevoValor = Math.floor(Math.random() * 100);
      this.gaugeValue.set(nuevoValor);
      this.updateChart(nuevoValor);
    }
  });
}

  updateChart(valor: number) {
    const ahora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Mantenemos solo los últimos 10 puntos
    this.historicalData.push(valor);
    this.labels.push(ahora);

    if (this.historicalData.length > 10) {
      this.historicalData.shift();
      this.labels.shift();
    }

    // Actualizamos la referencia del objeto para que Chart.js detecte el cambio
    this.lineChartData = {
      ...this.lineChartData,
      datasets: [{ ...this.lineChartData.datasets[0], data: [...this.historicalData] }],
      labels: [...this.labels]
    };
  }


  toggleSimulation() {
    this.isPaused.update(val => !val); // Invierte el estado true/false
  }

  ngOnDestroy() {
  this.sub.unsubscribe();
  }
}
