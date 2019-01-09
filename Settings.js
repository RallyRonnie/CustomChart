Ext.define('Settings', {
    singleton: true,

    getSettingsFields: function(context) {
         return [
             {name: 'ctitle', xtype: 'rallytextfield', fieldLabel: 'Chart Title'},
            {
                name: 'chartType',
                xtype: 'rallycombobox',
                plugins: ['rallyfieldvalidationui'],
                fieldLabel: 'Chart Type',
                displayField: 'name',
                width: 200,
                valueField: 'value',
                editable: false,
                allowBlank: false,
                store: Ext.create('Ext.data.Store', {
                    fields: ['name', 'value'],
                    data: [
                        { name: 'Bar', value: 'barchart' },
                        { name: 'Column', value: 'columnchart'},
                        { name: 'Pie', value: 'piechart' },
                    ]
                }),
                listeners: {
                    change: function (combo) {
                        combo.fireEvent('chartselected', combo.getValue(), combo.context);
                    }
                },
                bubbleEvents: ['chartselected'],
                handlesEvents: {
                    typeselected: function () {
                        this.fireEvent('chartselected', this.getValue());
                    }
                },
            },
            {
                name: 'types',
                xtype: 'rallycombobox',
                plugins: ['rallyfieldvalidationui'],
                allowBlank: false,
                editable: false,
                autoSelect: false,
                width: 300,
                validateOnChange: false,
                validateOnBlur: false,
                fieldLabel: 'Type', //todo: delete when multiselect enabled
                // multiSelect: true, //todo: need to validate either all artifacts chosen or only one non-artifact
                shouldRespondToScopeChange: true,
                context: context,
                // initialValue: ['HierarchicalRequirement'], //todo: not working
                storeConfig: {
                    model: 'TypeDefinition',
                    sorters: [{ property: 'DisplayName' }],
                    fetch: ['DisplayName', 'TypePath'],
                    filters: [{ property: 'UserListable', value: true }],
                    autoLoad: false,
                    remoteSort: false,
                    sortOnLoad: true,
                    remoteFilter: true
                },
                displayField: 'DisplayName',
                valueField: 'TypePath',
                listeners: {
                    change: function (combo) {
                        combo.fireEvent('typeselected', combo.getValue(), combo.context);
                    },
                    ready: function (combo) {
                      combo.fireEvent('typeselected', combo.getValue(), combo.context);
                    }
                },
                bubbleEvents: ['typeselected'],
                readyEvent: 'ready',
                handlesEvents: {
                    projectscopechanged: function (context) {
                        this.refreshWithNewContext(context);
                    }
                }
            },
            {
                name: 'aggregationField', //todo: don't validate on settings load
                xtype: 'rallyfieldcombobox',
                plugins: ['rallyfieldvalidationui'],
                fieldLabel: 'Aggregate By',
                readyEvent: 'ready',
                allowBlank: false,
                validateOnChange: false,
                validateOnBlur: false,
                width: 300,
                handlesEvents: {
                    typeselected: function (models, context) {
                        var type = Ext.Array.from(models)[0];
                        if (type) {
                            this.refreshWithNewModelType(type, context); //todo: how to handle multiple models
                        } else {
                            this.store.removeAll();
                            this.reset();
                        }
                    }
                },
                bubbleEvents: ['fieldselected'],
                listeners: {
                    change: function (combo) {
                        if (combo.getRecord()) {
                            combo.fireEvent('fieldselected', combo.getRecord().get('fieldDefinition'));
                        }
                    },
                    ready: function (combo) {
                        combo.store.filterBy(function (record) {
                            var field = record.get('fieldDefinition'),
                                attr = field.attributeDefinition,
                                whiteList = ['Tags', 'Milestones'];
                            return attr && !attr.Hidden && (((attr.AttributeType !== 'COLLECTION' || field.isMultiValueCustom()) &&
                                !field.isMappedFromArtifact) || _.contains(whiteList, field.name));
                        });
                        var fields = Ext.Array.map(combo.store.getRange(), function (record) {
                            return record.get(combo.getValueField());
                        });

                        if (!Ext.Array.contains(fields, combo.getValue())) {
                            combo.setValue(fields[0]);
                        }

                        if (combo.getRecord()) {
                            combo.fireEvent('fieldselected', combo.getRecord().get('fieldDefinition'));
                        }
                    }
                }
            },
            {
                name: 'bucketBy',
                xtype: 'rallycombobox',
                plugins: ['rallyfieldvalidationui'],
                fieldLabel: 'Bucket By',
                displayField: 'name',
                valueField: 'value',
                editable: false,
                allowBlank: false,
                store: {
                    fields: ['name', 'value'],
                    data: [
                        { name: 'Day', value: 'day' },
                        { name: 'Week', value: 'week' },
                        { name: 'Month', value: 'month' },
                        { name: 'Quarter', value: 'quarter' },
                        // { name: 'Release', value: 'release' },
                        { name: 'Year', value: 'year' }
                    ]
                },
                lastQuery: '',
                hidden: true,
                toggleVisibility: function() {
                    if (this.selectedFieldType === 'date' && this.selectedChartType !== 'piechart') {
                        this.show();
                      } else {
                        this.hide();
                    }
                },
                handlesEvents: {
                    fieldselected: function(field) {
                        this.selectedFieldType = field.getType();
                        this.toggleVisibility();
                    },
                    chartselected: function (type) {
                        this.selectedChartType = type;
                        this.toggleVisibility();
                    }
                }
            },
            {
                name: 'aggregationType',
                xtype: 'rallycombobox',
                plugins: ['rallyfieldvalidationui'],
                fieldLabel: 'Aggregation Type',
                displayField: 'name',
                valueField: 'value',
                editable: false,
                allowBlank: false,
                width: 300,
                store: {
                    fields: ['name', 'value'],
                    data: [
                        { name: 'Accepted Leaf Story Count', value: 'acceptedleafcount' },
                        { name: 'Accepted Leaf Story Plan Estimate Total', value: 'acceptedleafplanest' },
                        { name: 'Count', value: 'count' },
                        { name: 'Plan Estimate Total', value: 'estimate' },
                        { name: 'Leaf Story Count', value: 'leafcount' },
                        { name: 'Leaf Story Plan Estimate Total', value: 'leafplanest' },
                        { name: 'Preliminary Estimate Total', value: 'prelimest' },
                        { name: 'Refined Estimate Total', value: 'refinedest' },
                        { name: 'Actuals Total', value: 'taskactuals'},
                        { name: 'Estimate Total', value: 'taskest'}
                    ]
                },
                lastQuery: '',
                handlesEvents: {
                    typeselected: function (types) {
                        var type = Ext.Array.from(types)[0];
                        Rally.data.ModelFactory.getModel({
                            type: type,
                            success: function(model) {
                                this.store.filterBy(function(record) {
                                    return record.get('value') === 'count' ||
                                        model.hasField(Utils.getFieldForAggregationType(record.get('value')));
                                });
                                if (!this.store.findRecord('value', this.getValue())) {
                                    this.setValue('count');
                                }
                            },
                            scope: this
                        });

                    }
                },
            },
            {
                name: 'stackField',
                xtype: 'rallyfieldcombobox',
                plugins: ['rallyfieldvalidationui'],
                fieldLabel: 'Stack By',
                readyEvent: 'ready',
                allowBlank: false,
                allowNoEntry: true,
                noEntryText: '-- No Stacking --',
                validateOnChange: false,
                validateOnBlur: false,
                width: 300,
                hidden: true,
                toggleVisibility: function(chartType) {
                    if (chartType === 'piechart') {
                        this.hide();
                        this.select(this.store.getRange()[0]);
                    } else {
                        this.show();
                    }
                },
                handlesEvents: {
                    chartselected: function (chartType) {
                        this.toggleVisibility(chartType);
                    },
                    typeselected: function (models, context) {
                        var type = Ext.Array.from(models)[0];
                        if (type) {
                            this.refreshWithNewModelType(type, context); //todo: how to handle multiple models
                        }
                    }
                },
                listeners: {
                    ready: function (combo) {
                        combo.store.filterBy(function (record) {
                            var field = record.get('fieldDefinition'),
                                attr = field.attributeDefinition;

                            return record.get(combo.getValueField()) === combo.noEntryValue ||
                                (attr && !attr.Hidden && field.hasAllowedValues() && !_.contains(['collection'], field.getType()));
                        });

                        var fields = Ext.Array.map(combo.store.getRange(), function (record) {
                            return record.get(combo.getValueField());
                        });

                        if (!Ext.Array.contains(fields, combo.getValue())) {
                            combo.setValue(fields[0]);
                        }
                    }
                }
            },
            {name: 'customColors', xtype: 'label', text: 'Chart Colors (name, #number, rgba(x,x,x,x)):'},
            {name: 'customColor1', xtype: 'rallytextfield', label: 'Color 1:', margin: '0 0 0 10'},
            {name: 'customColor2', xtype: 'rallytextfield', label: 'Color 2:', margin: '0 0 0 10'},
            {name: 'customColor3', xtype: 'rallytextfield', label: 'Color 3:', margin: '0 0 0 10'},
            {name: 'customColor4', xtype: 'rallytextfield', label: 'Color 4:', margin: '0 0 0 10'},
            {name: 'customColor5', xtype: 'rallytextfield', label: 'Color 5:', margin: '0 0 0 10'},
            {name: 'customColor6', xtype: 'rallytextfield', label: 'Color 6:', margin: '0 0 0 10'},
            {name: 'customColor7', xtype: 'rallytextfield', label: 'Color 7:', margin: '0 0 0 10'},
            {name: 'customColor8', xtype: 'rallytextfield', label: 'Color 8:', margin: '0 0 0 10'},
            {
                name: 'customColor9',
                xtype: 'rallytextfield',
                width: 500,
                label: 'Colors 9-n:',
                margin: '0 0 10 10'
            },
// PIE Specific Settings
            {
                name: 'pieDistance',
                xtype: 'rallynumberfield',
                label: 'Pie Label Position (- = inside slice):',
                margin: '0 0 0 0',
                toggleVisibility: function(chartType) {
                    if (chartType === 'piechart') {
                        this.show();
                    } else {
                        this.hide();
                    }
                },
                handlesEvents: {
                    chartselected: function (chartType) {
                        this.toggleVisibility(chartType);
                    }
                }
            },
            {
                name: 'pieLabelWidth',
                xtype: 'rallynumberfield',
                label: 'Pie Label Width (px):',
                margin: '0 0 0 0',
                toggleVisibility: function(chartType) {
                    if (chartType === 'piechart') {
                        this.show();
                    } else {
                        this.hide();
                    }
                },
                handlesEvents: {
                    chartselected: function (chartType) {
                        this.toggleVisibility(chartType);
                    }
                }
            },
            {
                name: 'pieShowLegend',
                xtype: 'rallycheckboxfield',
                label: 'Pie Show Legend:',
                margin: '0 0 0 0',
                toggleVisibility: function(chartType) {
                    if (chartType === 'piechart') {
                        this.show();
                    } else {
                        this.hide();
                    }
                },
                handlesEvents: {
                    chartselected: function (chartType) {
                        this.toggleVisibility(chartType);
                    }
                }
            },           
            { type: 'query' }
        ];
    }
});
