import {
    initializeBlock,
    useBase,
    useRecords,
    useGlobalConfig,
    TablePickerSynced,
    ViewPickerSynced,
    FieldPickerSynced,
    Box,
    FormField,
} from '@airtable/blocks/ui';
import React, { useReducer, useState, useEffect } from 'react';

// This app uses chart.js and the react-chartjs-2 packages.
// Install them by running this in the terminal:
// npm install chart.js react-chartjs-2
import {Bar} from 'react-chartjs-2';

import { SelectButtons } from "@airtable/blocks/ui"

import { globalConfig } from '@airtable/blocks';

const GlobalConfigKeys = {
    TABLE_ID: 'tableId',
    VIEW_ID: 'viewId',
    X_FIELD_ID: 'xFieldId',
    Y_FIELD_ID: 'yFieldId',
    SITE_ROOM_SWITCH: "Site"
};

const options = [{value:"Room",label:"Room"},{value:"Site",label:"Site"}];

function DataExplorer() {
    const base = useBase();
    const globalConfig = useGlobalConfig();

    const [value, setValue] = useState(options[0].value);

    const tableId = globalConfig.get(GlobalConfigKeys.TABLE_ID);
    const table = base.getTableByIdIfExists(tableId);

    const viewId = globalConfig.get(GlobalConfigKeys.VIEW_ID);
    const view = table ? table.getViewByIdIfExists(viewId) : null;

    const xFieldId = globalConfig.get(GlobalConfigKeys.X_FIELD_ID);
    const xField = table ? table.getFieldByIdIfExists(xFieldId) : null;

    const yFieldId = globalConfig.get(GlobalConfigKeys.Y_FIELD_ID);
    const yField = table ? table.getFieldByIdIfExists(yFieldId) : null;

    const records = useRecords(view);

    const data = records && xField ? getChartData({records, xField}) : null;


    return (
        <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            display="flex"
            flexDirection="column"
        >
            <Settings table={table} valueProp={value} setValueProp = {setValue}/>
            {data && (
                <Box position="relative" flex="auto" padding={3}>
                    <Bar
                        data={data}
                        options={{
                            maintainAspectRatio: false,
                            scales: {
                                yAxes: [
                                    {
                                        ticks: {
                                            beginAtZero: true,
                                        },
                                    },
                                ],
                            },
                            legend: {
                                display: false,
                            },
                        }}
                    />
                </Box>
            )}
        </Box>
    );
}

function reduce(arr, reducer, initialValue) {
    let sumOfField = initialValue;
    for (const val of array) {
      accumulator = reducer(accumulator, val);
    }
    return accumulator;
  }

function getChartData({records, xField}) {
    const recordsByXValueString = new Map();
    for (const record of records) {

        // Hard Coded Value To Tie Data Explorer To Particular Table
        const xValue = record.getCellValue(GlobalConfigKeys.SITE_ROOM_SWITCH);
        const xValueString = xValue === null ? null : record.getCellValueAsString("Site");

        if (!recordsByXValueString.has(xValueString)) {
            recordsByXValueString.set(xValueString, [record]);
        } else {
            recordsByXValueString.get(xValueString).push(record);
        }
    }

    const labels = [];
    const points = [];
    for (const [xValueString, records] of recordsByXValueString.entries()) {
        const label = xValueString === null ? 'Empty' : xValueString;
        labels.push(label);
        
        points.push(records.map((record)=>record.getCellValue(xField)).reduce(function(acc, val) { return acc + val; }, 0))
        
        // points.push()
        // if (records.length == 1){
        //     points.push(records[0].getCellValue(xField));
        // }
        // else if records.length > 1{
        //     var sum = 0
        //     for (item of records){
        //         sum = sum + item.getCellValue()
        //     }
        // }
    }

    const data = {
        labels,
        datasets: [
            {
                backgroundColor: '#4380f1',
                data: points,
            },
        ],
    };
    return data;
}

function Settings({table,valueProp,setValueProp}) {

    return (

        <Box display="flex" padding={3} borderBottom="thick">
            <FormField label="Table" width="22%" paddingRight={1} marginBottom={0}>
                <TablePickerSynced globalConfigKey={GlobalConfigKeys.TABLE_ID} />
            </FormField>
            {table && (
                <FormField label="View" width="22%" paddingX={1} marginBottom={0}>
                    <ViewPickerSynced table={table} globalConfigKey={GlobalConfigKeys.VIEW_ID} />
                </FormField>
            )}
            {table && (
                <FormField label="Dimension" width="22%" paddingLeft={1} marginBottom={0}>
                    <FieldPickerSynced
                        table={table}
                        globalConfigKey={GlobalConfigKeys.X_FIELD_ID}
                    />
                </FormField>
            )}
            {table && (
                <SelectButtons
                    value={valueProp}
                    onChange={newValue => setValue(newValue)}
                    
                    options={options}
                    width="12%"
                />
            )}
        </Box>
    );
}

initializeBlock(() => <DataExplorer />);
