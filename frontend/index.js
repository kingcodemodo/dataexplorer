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
            {state.chartMetricState === "Metrics" && MetricsUI(records,state)}

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

        // For Every Record In The List Of Records Assigned To An X Value String Extract Only The Field That Is Wanted
        // Create Instead A List Of Values For Just That Field
        // Using Reduce Walk Through That List And Accumulate All The Values Into A Single field
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
  
function MetricsUI({records, state}) {
    
    const recordsByXValueString = new Map();

    //Iterate Over Records
    for (const record of records) {

        // The Query of the Records 
        const xValue = record.getCellValue(state.groupByState);
        const xValueString = xValue === null ? null : record.getCellValueAsString(state.groupByState);

        //Update Key/Value Sorting Records By Either Group or Room According To User Preference
        //For Those Records With Matching ID Fields, Assemble A List of Records
        if (!recordsByXValueString.has(xValueString)) {
            recordsByXValueString.set(xValueString, [record]);
        } else {
            recordsByXValueString.get(xValueString).push(record);
        }
    }

    const headers = [
            {name: "Room", selector: 'Room', sortable: true}, 
            {name: "Site", selector: 'Site', sortable: true},
            {name: "Required Fill", selector: 'Required Fill', sortable: true}, 
            {name: "Desk Price", selector: 'Desk Price', sortable: true}, 
            {name: "Spaces Taken", selector: 'Spaces Taken', sortable: true}, 
            {name: "Spaces Left", selector: 'Spaces Left', sortable: true}, 
            {name: "Desk Count", selector: 'Desk Count', sortable: true}, 
            {name: "Member Count", selector: 'Member Count', sortable: true}, 
            {name: "Revenue", selector: 'Revenue', sortable: true}, 
            {name: "Desk Price", selector: 'Desk Price', sortable: true}
        ]

    // Processing Each Record Grouped By ID
    for (const [xValueString, records] of recordsByXValueString.entries()) {

        // Extract Data Values & Label
        const label = xValueString === null ? 'Empty' : xValueString;

        // This Function Will Take Out Each Value For Each Field in The Airtable
        // And Parse Them Individually Into A Templated Object To Assemble The List Of Records In The Table One By One

        // For Each Of The Records For Every Key (With Possible Overlaps Due To Duplicate Keys)
        // Use Reduce To Aggregate Any Keys That Have Multiple Matching Keys
        // 

        // The Difference Here Is That We Want To Extract Each Field For Each Records
        // And Then Reduce Each Field Down To It's Own Individual Value
        // k,<Record>[Array] -> k, <{eachFieldName:valueForThatField, ...}>[Array]-> [{eachFieldName:eachValueForThatField, anotherFieldName}]
        // A List Of Records for Each Key -> Multiple Records Of The Parsed Data Structure For Each Key ->
        // First We Extract Each Field Of The Record And Append That Into An Object
        // That Object Will Be Of The Format
        const valueset = records.map((record)=>{
                                                    var parsedRecord = {}
                                                    for (item in headers){
                                                        parsedRecord[item.name] = record.getCellValue(item.name)
                                                    }
                                                    console.log(parsedRecord)
                                                    return parsedRecord;
                                                }
                                            )
        var mergedParsedDataEntities = {}
                                          
        console.log("==========================================================")
        //For Every Key In The Processed DataSet
        for (key in valueset){
            //Initialise A New Object That Will Store The Single Data Object Aggregating All Values
            mergedParsedDataEntities[key] = {}
            console.log("1 - " + key)
            //For Every Object/Record Stored At That Key
            for (item in valueset[key]){
                console.log("   2 - " + item)
                //And For Every Field In Each Of Those Objects
                for (field in headers){
                    console.log("       3 - " + field)
                    // If The Field Does Not Already Exist In The New Merged Record
                    // Then Lodge A Place In The Merged Parsed Data Object for That Header And Assign The First Value To It
                    // If The Key Already Exists Then Add The Latest Value On To The Value Currently Stored
                    field in mergedParsedDataEntities[key] ? mergedParsedDataEntities[key][field] += valueset[key][field] : mergedParsedDataEntities[key][field] = valueset[key][field]
                }
            }
        }
        console.log("==========================================================")
        
        
    }

    // const listOfHeaders = ["Room","Site","Required Fill","Desk Price","Spaces Taken",
    //                        "Spaces Left","Desk Count","Member Count","Revenue","Desk Price"]

    // const tableData = [{field1: 1, field2 : "Yes", field3 : "No"},{field1: 2, field2 : "Yes", field3 : "No"}]
    
    
    return(
        <Box position="relative" padding={"5%"} height={state.metricsSize} width={"40%"}>
            <DataTable
                title="Metrics"
                columns={headers}
                data={mergedParsedDataEntities}
            />
        </Box>
    )
}
initializeBlock(() => <DataExplorer />);
