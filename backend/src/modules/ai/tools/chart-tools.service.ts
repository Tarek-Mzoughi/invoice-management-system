import { Injectable } from '@nestjs/common';
import { AnalyticsToolsService } from './analytics-tools.service';
import { AI_CHART_TYPE } from '../enums/ai-chart-type.enum';

const CHART_COLORS = [
  '#5470c6',
  '#91cc75',
  '#fac858',
  '#ee6666',
  '#73c0de',
  '#3ba272',
  '#fc8452',
  '#9a60b4',
  '#ea7ccc',
];

@Injectable()
export class ChartToolsService {
  constructor(private readonly analyticsTools: AnalyticsToolsService) {}

  async buildChartFromData(
    chartType: string,
    title: string,
    dataSource: string,
    cabinetId: number,
  ): Promise<{
    echartsOption: Record<string, unknown>;
    sourceData: unknown[];
  }> {
    const data = await this.fetchDataForChart(dataSource, cabinetId);

    switch (dataSource) {
      case 'monthlyRevenue':
        return this.buildMonthlyRevenueChart(chartType, title, data);
      case 'invoicesByStatus':
        return this.buildInvoicesByStatusChart(chartType, title, data);
      case 'paymentsByMethod':
        return this.buildPaymentsByMethodChart(chartType, title, data);
      case 'topCustomers':
        return this.buildTopCustomersChart(chartType, title, data);
      case 'quotesStatus':
        return this.buildQuotesStatusChart(chartType, title, data);
      case 'paidVsUnpaid':
        return this.buildPaidVsUnpaidChart(chartType, title, data);
      default:
        return this.buildGenericChart(chartType, title, data);
    }
  }

  private async fetchDataForChart(
    dataSource: string,
    cabinetId: number,
  ): Promise<unknown> {
    switch (dataSource) {
      case 'monthlyRevenue':
        return this.analyticsTools.getMonthlyRevenue(cabinetId, 12);
      case 'invoicesByStatus':
      case 'paidVsUnpaid':
        return this.analyticsTools.getInvoiceSummary(cabinetId);
      case 'paymentsByMethod':
        return this.analyticsTools.getPaymentsByMethod(cabinetId);
      case 'topCustomers':
        return this.analyticsTools.getTopCustomersByRevenue(cabinetId, 10);
      case 'quotesStatus':
        return this.analyticsTools.getQuotesStatusSummary(cabinetId);
      default:
        return this.analyticsTools.getDashboardKpis(cabinetId);
    }
  }

  private buildMonthlyRevenueChart(
    chartType: string,
    title: string,
    data: unknown,
  ) {
    const monthlyData = data as Array<{
      month: string;
      total: number;
      count: number;
    }>;
    const months = monthlyData.map((d) => d.month);
    const totals = monthlyData.map((d) => d.total);

    const resolvedType =
      chartType === AI_CHART_TYPE.Area ? 'line' : chartType || 'bar';

    return {
      echartsOption: {
        title: { text: title, left: 'center' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: months },
        yAxis: { type: 'value', name: 'Montant (TND)' },
        series: [
          {
            name: "Chiffre d'affaires",
            type: resolvedType,
            data: totals,
            itemStyle: { color: CHART_COLORS[0] },
            areaStyle: chartType === AI_CHART_TYPE.Area ? {} : undefined,
          },
        ],
      },
      sourceData: monthlyData,
    };
  }

  private buildInvoicesByStatusChart(
    chartType: string,
    title: string,
    data: unknown,
  ) {
    const summary = data as Record<string, number>;
    const items = [
      { name: 'Payées', value: summary.paid ?? 0 },
      { name: 'Impayées', value: summary.unpaid ?? 0 },
      { name: 'Partiellement payées', value: summary.partiallyPaid ?? 0 },
      { name: 'En retard', value: summary.overdue ?? 0 },
    ].filter((item) => item.value > 0);

    if (chartType === 'pie' || chartType === 'doughnut') {
      return {
        echartsOption: {
          title: { text: title, left: 'center' },
          tooltip: { trigger: 'item' },
          legend: { bottom: '5%', left: 'center' },
          series: [
            {
              type: 'pie',
              radius: chartType === 'doughnut' ? ['40%', '70%'] : '70%',
              data: items,
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.5)',
                },
              },
            },
          ],
        },
        sourceData: items,
      };
    }

    return {
      echartsOption: {
        title: { text: title, left: 'center' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: items.map((i) => i.name) },
        yAxis: { type: 'value' },
        series: [
          {
            type: 'bar',
            data: items.map((i, idx) => ({
              value: i.value,
              itemStyle: { color: CHART_COLORS[idx % CHART_COLORS.length] },
            })),
          },
        ],
      },
      sourceData: items,
    };
  }

  private buildPaymentsByMethodChart(
    chartType: string,
    title: string,
    data: unknown,
  ) {
    const payments = data as Array<{
      method: string;
      total: number;
      count: number;
    }>;

    const methodLabels: Record<string, string> = {
      'payment.payment_mode.cash': 'Espèces',
      'payment.payment_mode.check': 'Chèque',
      'payment.payment_mode.bank_transfer': 'Virement',
      'payment.payment_mode.credit_card': 'Carte bancaire',
      'payment.payment_mode.bill_of_exchange': 'Effet de commerce',
      'payment.payment_mode.wire_transfer': 'Virement bancaire',
    };

    const items = payments.map((p) => ({
      name: methodLabels[p.method] ?? p.method,
      value: p.total,
    }));

    return {
      echartsOption: {
        title: { text: title, left: 'center' },
        tooltip: { trigger: 'item' },
        legend: { bottom: '5%', left: 'center' },
        series: [
          {
            type: 'pie',
            radius: ['40%', '70%'],
            data: items,
          },
        ],
      },
      sourceData: payments,
    };
  }

  private buildTopCustomersChart(
    chartType: string,
    title: string,
    data: unknown,
  ) {
    const customers = data as Array<{
      customerName: string;
      totalRevenue: number;
      invoiceCount: number;
    }>;

    return {
      echartsOption: {
        title: { text: title, left: 'center' },
        tooltip: { trigger: 'axis' },
        xAxis: {
          type: 'category',
          data: customers.map((c) => c.customerName),
          axisLabel: { rotate: 30 },
        },
        yAxis: { type: 'value', name: 'CA (TND)' },
        series: [
          {
            type: 'bar',
            data: customers.map((c, idx) => ({
              value: c.totalRevenue,
              itemStyle: {
                color: CHART_COLORS[idx % CHART_COLORS.length],
              },
            })),
          },
        ],
      },
      sourceData: customers,
    };
  }

  private buildQuotesStatusChart(
    chartType: string,
    title: string,
    data: unknown,
  ) {
    const summary = data as {
      total: number;
      byStatus: Record<string, number>;
    };

    const statusLabels: Record<string, string> = {
      'quotation.status.draft': 'Brouillon',
      'quotation.status.validated': 'Validé',
      'quotation.status.sent': 'Envoyé',
      'quotation.status.accepted': 'Accepté',
      'quotation.status.rejected': 'Rejeté',
      'quotation.status.invoiced': 'Facturé',
      'quotation.status.expired': 'Expiré',
    };

    const items = Object.entries(summary.byStatus).map(([status, count]) => ({
      name: statusLabels[status] ?? status,
      value: count,
    }));

    return {
      echartsOption: {
        title: { text: title, left: 'center' },
        tooltip: { trigger: 'item' },
        legend: { bottom: '5%', left: 'center' },
        series: [{ type: 'pie', radius: '70%', data: items }],
      },
      sourceData: items,
    };
  }

  private buildPaidVsUnpaidChart(
    chartType: string,
    title: string,
    data: unknown,
  ) {
    const summary = data as Record<string, number>;
    return this.buildInvoicesByStatusChart(chartType || 'bar', title, summary);
  }

  private buildGenericChart(chartType: string, title: string, data: unknown) {
    return {
      echartsOption: {
        title: { text: title, left: 'center' },
        tooltip: {},
        series: [],
      },
      sourceData: Array.isArray(data) ? data : [data],
    };
  }
}
