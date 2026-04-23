import { Injectable } from '@nestjs/common';
import { metrics } from '@opentelemetry/api';
import type { Counter, Histogram, UpDownCounter } from '@opentelemetry/api';

export interface InstrumentOptions {
  description?: string;
  unit?: string;
}

export interface HistogramOptions extends InstrumentOptions {
  boundaries?: number[];
}

@Injectable()
export class MetricsService {
  private readonly meter = metrics.getMeter('gomin', '1.0.0');

  counter(name: string, options?: InstrumentOptions): Counter {
    return this.meter.createCounter(name, options);
  }

  upDownCounter(name: string, options?: InstrumentOptions): UpDownCounter {
    return this.meter.createUpDownCounter(name, options);
  }

  histogram(name: string, options?: HistogramOptions): Histogram {
    return this.meter.createHistogram(name, options);
  }
}
