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

import {Bar} from 'react-chartjs-2';

import { SelectButtons } from "@airtable/blocks/ui"

import { globalConfig } from '@airtable/blocks';

import DataTable from 'react-data-table-component'

const GlobalConfigKeys = {
    TABLE_ID: 'tableId',
    VIEW_ID: 'viewId',
    X_FIELD_ID: 'xFieldId',
    Y_FIELD_ID: 'yFieldId',
    SITE_ROOM_SWITCH: "Site"
};

// Options For Selecting Between Room/Site Groupings of Data
const groupByOptions = [{value:"Room",label:"Room"},{value:"Site",label:"Site"}];

// Options For Selecting Between Visualising Data In Numerical Form or Graph For
const chartMetricOptions = [{value:"Chart",label:"Chart"},{value:"Metrics",label:"Metrics"}];

// Key Value Store To Lookup What Size Components Should Be When The System Re-Structures For Chart / Numerical Modes
const componentSizeLookup = {"Chart" : "90%", "Metrics" : "0%"};

function DataExplorer() {
    const base = useBase();
    const globalConfig = useGlobalConfig();

    const tableId = globalConfig.get(GlobalConfigKeys.TABLE_ID);
    const table = base.getTableByIdIfExists(tableId);

    const [state, setState] = useState({groupByState : groupByOptions[0].value,
                                        chartMetricState : chartMetricOptions[0].value,
                                        graphSize : "65%",
                                        metricsSize : "100%"});

    const viewId = globalConfig.get(GlobalConfigKeys.VIEW_ID);
    const view = table ? table.getViewByIdIfExists(viewId) : null;

    const xFieldId = globalConfig.get(GlobalConfigKeys.X_FIELD_ID);
    const xField = table ? table.getFieldByIdIfExists(xFieldId) : null;

    const yFieldId = globalConfig.get(GlobalConfigKeys.Y_FIELD_ID);
    const yField = table ? table.getFieldByIdIfExists(yFieldId) : null;

    const records = useRecords(view);
    
    const data = records && xField ? getChartData({records, xField, state}) : null;

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
        
        <Settings table={table} stateProp={state} setStateProp = {setState}/>
            {data && (
                <Box position="relative" padding={3} height={state.graphSize}>
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
            {/* {state.chartMetricState === "Metrics" && (
                <Box position="relative" padding={3} height={state.metricsSize}>
                    Yellow
                </Box>
            )} */}
            {state.chartMetricState === "Metrics" && MetricsUI(state)}

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

function getChartData({records, xField, state}) {
    const recordsByXValueString = new Map();
    for (const record of records) {

        // The Query of the Records 
        const xValue = record.getCellValue(state.groupByState);
        const xValueString = xValue === null ? null : record.getCellValueAsString(state.groupByState);

        if (!recordsByXValueString.has(xValueString)) {
            recordsByXValueString.set(xValueString, [record]);
        } else {
            recordsByXValueString.get(xValueString).push(record);
        }
    }

    const labels = [];
    const points = [];
    
    for (const [xValueString, records] of recordsByXValueString.entries()) {

        // Extract Data Values & Label
        const label = xValueString === null ? 'Empty' : xValueString;
        const valueset = records.map((record)=>record.getCellValue(xField)).reduce(function(acc, val) { return acc + val; }, 0)

        // Add Entity/Label To Graph
        labels.push(label);

        // Add Datapoints for Each Entity To Graph
        points.push(valueset)
        
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
    console.log("data.labels========================================")
    console.log(data.labels)
    console.log("===================================================")
    console.log("data.datasets======================================")
    console.log(data.datasets)
    console.log("===================================================")
    console.log("data.datasets.data=================================")
    console.log(data.datasets[0].data)
    console.log("===================================================")
    console.log("data.datasets.data.points==========================")
    console.log(data.datasets[0].data.points)
    console.log("===================================================")
    return data;
}

function Settings({table,stateProp,setStateProp}) {

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
                <FormField label="Dimension" width="22%" paddingX={1} marginBottom={0}>
                    <FieldPickerSynced
                        table={table}
                        globalConfigKey={GlobalConfigKeys.X_FIELD_ID}
                    />
                </FormField>
            )}
            {table && (
                <FormField label="Group By" width="17%" paddingX={1} marginBottom={0}>
                    <SelectButtons
                        value={stateProp.groupByState}
                        onChange={newValue => setStateProp({...stateProp, groupByState : newValue})}
                        options={groupByOptions}
                        paddingLeft={1}
                        marginBottom={0}
                        width="100%"
                    />
                </FormField>
            )}
            {(
                <FormField label="Chart or Metrics" width="17%" paddingLeft={1} marginBottom={0}>
                    <SelectButtons
                        value={stateProp.chartMetricState}
                        onChange={newValue => setStateProp({...stateProp, chartMetricState : newValue, graphSize : componentSizeLookup[newValue]})}
                        options={chartMetricOptions}
                        paddingLeft={1}
                        marginBottom={0}
                        width="100%"
                    />
                </FormField>
            )}
        </Box>
    );
}

function MetricsUI(state){
    return(
        <Box position="relative" padding={3} height={state.metricsSize}>
            Yellow
        </Box>
    )
}
initializeBlock(() => <DataExplorer />);
