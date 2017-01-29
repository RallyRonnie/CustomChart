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
            stackField: '',
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

    _onModelsLoaded: function(models) {
        this.models = _.values(models);
        var model = this.models[0],
            stackingSetting = this._getStackingSetting(),
            stackingField = stackingSetting && model.getField(stackingSetting);

        if (stackingField && stackingField.hasAllowedValues() && _.contains(['rating', 'string'], stackingField.getType())) {
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
                                defaultFields: this._getQuickFilters()
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
        var quickFilters = [],
          types = this._getTypesSetting(),
          type = types[0];
        if (types.length > 1) {
            quickFilters.push('ModelType');
        }

        if (Rally.data.ModelTypes.isArtifact(type)) {
            quickFilters.push('Owner');
            if (Rally.data.ModelTypes.isPortfolioItem(type)) {
                quickFilters.push('State');
            } else {
                quickFilters.push('ScheduleState');
            }
        }

        return quickFilters;
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
            stackValues = this.stackValues;

        return {
            xtype: chartType,
            enableStacking: !!stackField,
            storeType: 'Rally.data.wsapi.artifact.Store', //todo: only if artifact types selected
            chartColors: [
              "#FF8200", // $orange
              "#F6A900", // $gold
              "#FAD200", // $yellow
              "#8DC63F", // $lime
              "#1E7C00", // $green_dk
              "#337EC6", // $blue_link
              "#005EB8", // $blue
              "#7832A5", // $purple,
              "#DA1884",  // $pink,
              "#C0C0C0" // $grey4
            ],
            storeConfig: {
                models: this._getTypesSetting(),
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
                stackValues: stackValues
            }
        };
    },

    onTimeboxScopeChange: function() {
        this.callParent(arguments);
        this._addBoard();
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
        return fetch;
    },

    _getChartSort: function() {
        var model = this.models[0],
            field = model.getField(this.getSetting('aggregationField')),
            sorters = [];

        if (field && field.getType() !== 'collection') {
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
            queries.push(Rally.data.QueryFilter.fromQueryString(this.getSetting('query')));
        }
        if (timeboxScope && _.any(this.models, timeboxScope.isApplicable, timeboxScope)) {
            queries.push(timeboxScope.getQueryFilter());
        }
        return queries;
    }
});
