Ext.define('PieChart', {
    xtype: 'piechart',
    extend: 'Rally.ui.chart.Chart',
    requires: [
        'PieCalculator'
    ],

    config: {
        chartConfig: {
            chart: {
                type: 'pie',
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false
            },
            title: {text: ''},
            tooltip: {
                headerFormat: '',
                pointFormat: '<b>{point.name}:</b> {point.percentage:.1f}% ({point.y}/{point.total})'
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        format: '<b>{point.name}:</b> {point.percentage:.1f}% ({point.y}/{point.total})',
                        style: {
                            color: 'black',
                            align: 'center'
                        }
                    }
                }
            }
        },
        calculatorType: 'PieCalculator'
    },

    constructor: function(config) {
        config = config || {};
        this.mergeConfig(config);

        this.chartConfig.plotOptions.pie.showInLegend = this.showLegend;
//        console.log(''+this.labelWidth+'px');
        this.chartConfig.plotOptions.pie.dataLabels.style.width = '' + this.labelWidth + 'px';
        this.chartConfig.plotOptions.pie.dataLabels.distance = this.labelDistance;

        if (this.showLegend) {
            this.chartConfig.tooltip.pointFormat = '{point.name}';
            this.chartConfig.plotOptions.pie.dataLabels.format = '{point.percentage:.1f}%';
        } else {
            this.chartConfig.tooltip.pointFormat = '';
            this.chartConfig.plotOptions.pie.dataLabels.format = '<b>{point.name}<br/><b>({point.percentage:.1f}%)';
        }

        this.callParent([this.config]);
    }
});
