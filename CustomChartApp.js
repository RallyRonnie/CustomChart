Ext.define('CustomChartApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    layout: 'fit',

    config: {
        defaultSettings: {
            types: 'Defect',
            chartType: 'piechart',
            aggregationField: 'State',
            aggregationType: 'count',
            bucketBy: '',
            stackField: '',
            pieLabelWidth: 150,
            pieDistance: 30,
            pieShowLegend: false,
            query: ''
        }
    },

    launch: function() {
        if (!this.getSetting('types')) {
            this.fireEvent('appsettingsneeded'); //todo: does this work?
        } else {
            Rally.data.wsapi.ModelFactory.getModels({
                types: this._getTypesSetting()
            }).then({
                success: this._onModelsLoaded,
                scope: this
            });
        }
    },

    getSettingsFields: function() {
       return Settings.getSettingsFields(this.getContext());
    },

    _shouldLoadAllowedStackValues: function(stackingField) {
      var hasAllowedValues = stackingField && stackingField.hasAllowedValues(), 
          shouldLoadAllowedValues = hasAllowedValues && (
            _.contains(['state', 'rating', 'string'], stackingField.getType()) ||
            stackingField.getAllowedValueType() === 'state' ||
            stackingField.getAllowedValueType() === 'flowstate'
          );
      return shouldLoadAllowedValues;
    },

    _onModelsLoaded: function(models) {
        this.models = _.values(models);
        var model = this.models[0],
            stackingSetting = this._getStackingSetting(),
            stackingField = stackingSetting && model.getField(stackingSetting);
            
        if (this._shouldLoadAllowedStackValues(stackingField)) {
            stackingField.getAllowedValueStore().load().then({
                success: function(records) {
                    this.stackValues = _.invoke(records, 'get', 'StringValue');
                    this._addChart();
                },
                scope: this
            });
        } else {
            this._addChart();
        }
    },

    _addChart: function() {
        var context = this.getContext(),
            whiteListFields = ['Milestones', 'Tags'],
            modelNames = _.pluck(this.models, 'typePath'),
            gridBoardConfig = {
                xtype: 'rallygridboard',
                toggleState: 'chart',
                chartConfig: this._getChartConfig(),
                plugins: [{
                    ptype:'rallygridboardinlinefiltercontrol',
                    showInChartMode: true,
                    inlineFilterButtonConfig: {
                        stateful: true,
                        stateId: context.getScopedStateId('filters'),
                        filterChildren: true,
                        modelNames: modelNames,
                        inlineFilterPanelConfig: {
                            quickFilterPanelConfig: {
                                defaultFields: this._getQuickFilters(),
                                addQuickFilterConfig: {
                                   whiteListFields: whiteListFields
                                }
                            },
                            advancedFilterPanelConfig: {
                               advancedFilterRowsConfig: {
                                   propertyFieldConfig: {
                                       whiteListFields: whiteListFields
                                   }
                               }
                           }
                        }
                    }
                },
                {
                    ptype: 'rallygridboardactionsmenu',
                    menuItems: [{
                        text: 'Export to CSV...',
                        handler: function() {
                            window.location = Rally.ui.gridboard.Export.buildCsvExportUrl(this.down('rallygridboard').getGridOrBoard());
                        },
                        scope: this
                    }],
                    buttonConfig: {
                        iconCls: 'icon-export',
                        toolTipConfig: {
                            html: 'Export',
                            anchor: 'top',
                            hideDelay: 0
                        }
                    }
                }],
                context: context,
                modelNames: modelNames,
                storeConfig: {
                    filters: this._getFilters()
                }
            };

        this.add(gridBoardConfig);
    },

    _getQuickFilters: function() {
        var quickFilters = ['Owner', 'State', 'ScheduleState'],
            model = this.models[0];
        if (this.models.length > 1) {
            quickFilters.push('ModelType');
        }

        return _.filter(quickFilters, function(quickFilter) {
            return model.hasField(quickFilter);
        });
    },

    _getTypesSetting: function() {
        return this.getSetting('types').split(',');
    },

    _getStackingSetting: function() {
        var chartType = this.getSetting('chartType');
        return chartType !== 'piechart' ? this.getSetting('stackField') : null;
    },

    _getChartConfig: function() {
        var chartType = this.getSetting('chartType'),
            stackField = this._getStackingSetting(),
            lWidth = this.getSetting('pieLabelWidth'),
            lDistance = this.getSetting('pieDistance'),
            sLegend = this.getSetting('pieShowLegend'),
            stackValues = this.stackValues,
            model = this.models[0],
            config = {
                xtype: chartType,
                enableStacking: !!stackField,
                labelWidth: lWidth,
                showLegend: !!sLegend,
                labelDistance: lDistance,
                chartColors: [
// Primary
                    '#a6cee3',
                    '#1f78b4',
                    '#b2df8a',
                    '#33a02c',
                    '#fb9a99',
                    '#e31a1c',
                    '#fdbf6f',
                    '#ff7f00',
                    '#cab2d6',
                    '#6a3d9a',
                    '#ffff99',
                    '#b15928',
                    '#8dd3c7', // Pastels
                    '#ffffb3',
                    '#bebada',
                    '#fb8072',
                    '#80b1d3',
                    '#fdb462',
                    '#b3de69',
                    '#fccde5',
                    '#d9d9d9',
                    '#bc80bd',
                    '#ccebc5',
                    '#ffed6f',
// default in community and kmores app
//                "#FF8200", // $orange
//                "#F6A900", // $gold
//                "#FAD200", // $yellow
//                "#8DC63F", // $lime
//                "#1E7C00", // $green_dk
//                "#337EC6", // $blue_link
//                "#005EB8", // $blue
//                "#7832A5", // $purple,
//                "#DA1884",  // $pink,
//                "#C0C0C0" // $grey4
'#c42525', // drk salmon
'#a6c96a', // lt olive green
'#7cb5ec', // lt blue
'#90ed7d', // lt green
'#f7a35c', // peach
'#8085e9', // lt purple
'#aa1925', // med red
'#f15c80', // pink
'#e4d354', // gold
'#2b908f', // drk teal
'#f45b5b', // med salmon
'#91e8e1', // cyan ish
'#1aadce', // med cyan
'#4572A7', // steel blue
'#AA4643', // drk salmon
'#89A54E', // med olive green
'#80699B', // med purple
'#3D96AE', // med teal
'#DB843D', // lt orange
'#92A8CD', // lt steel blue
'#A47D7C', // mauve
'#434348', // drk gray
'#B5CA92' // lt olive
],
                storeConfig: {
                    context: this.getContext().getDataContext(),
                    //TODO: can we do summary fetch here and not limit infinity?
                    //we'll have to also make sure the fetch is correct for export somehow...
                    limit: Infinity,
                    fetch: this._getChartFetch(),
                    sorters: this._getChartSort(),
                    pageSize: 2000,
                },
                calculatorConfig: {
                    calculationType: this.getSetting('aggregationType'),
                    field: this.getSetting('aggregationField'),
                    stackField: stackField,
                    stackValues: stackValues,
                    bucketBy: chartType === 'piechart' ? null : this.getSetting('bucketBy')
                }
            };

        if (model.isArtifact()) {
            config.storeConfig.models = this._getTypesSetting();
            config.storeType = 'Rally.data.wsapi.artifact.Store';
        } else {
            config.storeConfig.model = model;
            config.storeType = 'Rally.data.wsapi.Store';
        }

        return config;
    },

    onTimeboxScopeChange: function() {
        this.callParent(arguments);

        var gridBoard = this.down('rallygridboard');
        if (gridBoard) {
            gridBoard.destroy();
        }

        this._addChart();
    },

    _getChartFetch: function() {
        var field = this.getSetting('aggregationField'),
            aggregationType = this.getSetting('aggregationType'),
            stackField = this._getStackingSetting(),
            fetch = ['FormattedID', 'Name', field];

        if (aggregationType !== 'count') {
            fetch.push(Utils.getFieldForAggregationType(aggregationType));
        }
        if (stackField) {
            fetch.push(stackField);
        }

        if (_.contains(fetch, 'Iteration')) {
            fetch.push('StartDate');
        }
        if (_.contains(fetch, 'Release')) {
            fetch.push('ReleaseStartDate');
        }

        return fetch;
    },

    _getChartSort: function() {
        var model = this.models[0],
            field = model.getField(this.getSetting('aggregationField')),
            sorters = [];

        if (field && field.getType() !== 'collection' && field.sortable) {
            sorters.push({
                property: this.getSetting('aggregationField'),
                direction: 'ASC'
            });
        }

        return sorters;
    },

    _getFilters: function() {
        var queries = [],
            timeboxScope = this.getContext().getTimeboxScope();
        if (this.getSetting('query')) {
            var querySetting = this.getSetting('query').replace(/\{user\}/g, this.getContext().getUser()._ref);
            queries.push(Rally.data.QueryFilter.fromQueryString(querySetting));
        }
        if (timeboxScope && _.any(this.models, timeboxScope.isApplicable, timeboxScope)) {
            queries.push(timeboxScope.getQueryFilter());
        }
        return queries;
    }
});
