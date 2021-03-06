Ext.define('CustomChartApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    layout: 'fit',

    config: {
        defaultSettings: {
            ctitle: '',
            types: 'Defect',
            chartType: 'piechart',
            aggregationField: 'State',
            aggregationType: 'count',
            bucketBy: '',
            stackField: '',
            pieLabelWidth: 150,
            pieDistance: 30,
            pieShowLegend: false,
            customColor1: 'Green',
            customColor2: 'Blue',
            customColor3: 'Purple',
            customColor4: 'Orange',
            customColor5: 'Pink',
            customColor6: 'Lime',
            customColor7: 'Navy',
            customColor8: 'Magenta',
            customColor9: 'Brown; Maroon; Grey; Red; Teal; Olive; Beige',
            customLabel1: 'Dark Blue label',
            customLabel2: 'Blue Label',
            customLabel3: 'Green Label',
            customLabel4: 'Purple Label',
            customLabel5: 'Pink Label',
            customLabel6: 'Burnt Orange Label',
            customLabel7: 'Orange Label',
            customLabel8: 'Yellow Label',
            customLabel9: 'Grey Label',
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
        var cTitle = this.getSetting('ctitle');
        var cColors = [this.getSetting('customColor1')];
        cColors.push (this.getSetting('customColor2'));
        cColors.push (this.getSetting('customColor3'));
        cColors.push (this.getSetting('customColor4'));
        cColors.push (this.getSetting('customColor5'));
        cColors.push (this.getSetting('customColor6'));
        cColors.push (this.getSetting('customColor7'));
        cColors.push (this.getSetting('customColor8'));
//        cColors.push(this.getSetting('customColor9').split(";"));
        this.getSetting('customColor9').split(";").forEach(function(item){
            cColors.push(item.replace(/ /g,''));
        });
        console.log(cColors);
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
                chartColors: cColors,
                chartTitle: cTitle,
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
