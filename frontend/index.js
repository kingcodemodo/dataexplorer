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
    
    // COMMENTED const recordsByXValueString = new Map();

    // //Iterate Over Records
    // for (const record of records) {

    //     // The Query of the Records 
    //     const xValue = record.getCellValue(state.groupByState);
    //     const xValueString = xValue === null ? null : record.getCellValueAsString(state.groupByState);

    //     //Update Key/Value Sorting Records By Either Group or Room According To User Preference
    //     //For Those Records With Matching ID Fields, Assemble A List of Records
    //     if (!recordsByXValueString.has(xValueString)) {
    //         recordsByXValueString.set(xValueString, [record]);
    //     } else {
    //         recordsByXValueString.get(xValueString).push(record);
    //     }
    // COMMENTED }

    const headers = [
            {name: "Room", selector: 'Room', sortable: true}, 
            {name: "Site", selector: 'Site', sortable: true},
            {name: "Required Fill", selector: 'Required Fill', sortable: true}, 
            {name: "Desk Price", selector: 'Desk Price', sortable: true}, 
            {name: "Spaces Taken", selector: 'Spaces Taken', sortable: true}, 
            {name: "Spaces Left", selector: 'Spaces Left', sortable: true}, 
            {name: "Desk Count", selector: 'Desk Count', sortable: true}, 
            {name: "Member Count", selector: 'Member Count', sortable: true}, 
            {name: "Revenue", selector: 'Revenue', sortable: true}
        ]

    //COMMENTED // Processing Each Record Grouped By ID
    // for (const [xValueString, records] of recordsByXValueString.entries()) {

    //     // Extract Data Values & Label
    //     const label = xValueString === null ? 'Empty' : xValueString;

    //     // This Function Will Take Out Each Value For Each Field in The Airtable
    //     // And Parse Them Individually Into A Templated Object To Assemble The List Of Records In The Table One By One

    //     // For Each Of The Records For Every Key (With Possible Overlaps Due To Duplicate Keys)
    //     // Use Reduce To Aggregate Any Keys That Have Multiple Matching Keys
    //     // 

    //     // The Difference Here Is That We Want To Extract Each Field For Each Records
    //     // And Then Reduce Each Field Down To It's Own Individual Value
    //     // k,<Record>[Array] -> k, <{eachFieldName:valueForThatField, ...}>[Array]-> [{eachFieldName:eachValueForThatField, anotherFieldName}]
    //     // A List Of Records for Each Key -> Multiple Records Of The Parsed Data Structure For Each Key ->
    //     // First We Extract Each Field Of The Record And Append That Into An Object
    //     // That Object Will Be Of The Format
    //     const valueset = records.map((record)=>{
    //                                                 var parsedRecord = {}
    //                                                 for (item in headers){
    //                                                     parsedRecord[item.name] = record.getCellValue(item.name)
    //                                                 }
    //                                                 console.log(parsedRecord)
    //                                                 return parsedRecord;
    //                                             }
    //                                         )
    //     var mergedParsedDataEntities = {}
                                          
    //     console.log("==========================================================")
    //     //For Every Key In The Processed DataSet
    //     for (key in valueset){
    //         //Initialise A New Object That Will Store The Single Data Object Aggregating All Values
    //         mergedParsedDataEntities[key] = {}
    //         console.log("1 - " + key)
    //         //For Every Object/Record Stored At That Key
    //         for (item in valueset[key]){
    //             console.log("   2 - " + item)
    //             //And For Every Field In Each Of Those Objects
    //             for (field in headers){
    //                 console.log("       3 - " + field)
    //                 // If The Field Does Not Already Exist In The New Merged Record
    //                 // Then Lodge A Place In The Merged Parsed Data Object for That Header And Assign The First Value To It
    //                 // If The Key Already Exists Then Add The Latest Value On To The Value Currently Stored
    //                 //field in mergedParsedDataEntities[key] ? mergedParsedDataEntities[key][field] += valueset[key][field] : mergedParsedDataEntities[key][field] = valueset[key][field]
    //             }
    //         }
    //     }
    //     console.log("==========================================================")
        
        
    // COMMENTED }

    // headers = ["Room","Site","Required Fill","Desk Price","Spaces Taken",
    //                         "Spaces Left","Desk Count","Member Count","Revenue","Desk Price"]

    mergedParsedDataEntities = [
        {
          "Room": "AVO - Main Room",
          "Required Fill": "£0.00",
          "Revenue": "£2,748.00",
          "Desk Price": "£229.00",
          "Spaces Taken": 12,
          "Spaces Left": 0,
          "Site": "AVO",
          "Member Count": 3,
          "Desk Count": 3
        },
        {
          "Room": "AVO - Private Office",
          "Required Fill": "£0.00",
          "Revenue": "£445.00",
          "Desk Price": "£445.00",
          "Spaces Taken": 1,
          "Spaces Left": 0,
          "Site": "AVO",
          "Member Count": 1,
          "Desk Count": 1
        },
        {
          "Room": "AVO - textey",
          "Required Fill": "£0.00",
          "Revenue": "£445.00",
          "Desk Price": "£445.00",
          "Spaces Taken": 1,
          "Spaces Left": 0,
          "Site": "AVO",
          "Member Count": 1,
          "Desk Count": 1
        },
        {
          "Room": "BRO - Oratory",
          "Required Fill": "£0.00",
          "Revenue": "£1,500.00",
          "Desk Price": "£125.00",
          "Spaces Taken": 12,
          "Spaces Left": 0,
          "Site": "BRO",
          "Member Count": 7,
          "Desk Count": 12
        },
        {
          "Room": "BRO - Tardis",
          "Required Fill": "£1,000.00",
          "Revenue": "£2,375.00",
          "Desk Price": "£125.00",
          "Spaces Taken": 19,
          "Spaces Left": 8,
          "Site": "BRO",
          "Member Count": 17,
          "Desk Count": 19
        },
        {
          "Room": "CAT - Fixed",
          "Required Fill": "£570.00",
          "Revenue": "£1,900.00",
          "Desk Price": "£95.00",
          "Spaces Taken": 20,
          "Spaces Left": 6,
          "Site": "CAT",
          "Member Count": 14,
          "Desk Count": 31
        },
        {
          "Room": "CAT - Flexi",
          "Required Fill": "£2,405.00",
          "Revenue": "£325.00",
          "Desk Price": "£65.00",
          "Spaces Taken": 5,
          "Spaces Left": 37,
          "Site": "CAT",
          "Member Count": 5,
          "Desk Count": 5
        },
        {
          "Room": "CAT - Office 1",
          "Required Fill": "£0.00",
          "Revenue": "£3,570.00",
          "Desk Price": "£595.00",
          "Spaces Taken": 6,
          "Spaces Left": 0,
          "Site": "CAT",
          "Member Count": 1,
          "Desk Count": 1
        },
        {
          "Room": "CAT - Office 2",
          "Required Fill": "£0.00",
          "Revenue": "£1,150.00",
          "Desk Price": "£143.75",
          "Spaces Taken": 8,
          "Spaces Left": 0,
          "Site": "CAT",
          "Member Count": 1,
          "Desk Count": 1
        },
        {
          "Room": "CAT - Office 3",
          "Required Fill": "£0.00",
          "Revenue": "£600.00",
          "Desk Price": "£100.00",
          "Spaces Taken": 6,
          "Spaces Left": 0,
          "Site": "CAT",
          "Member Count": 2,
          "Desk Count": 2
        },
        {
          "Room": "CAT - Office 4",
          "Required Fill": "£0.00",
          "Revenue": "£10,000.00",
          "Desk Price": "£1,000.00",
          "Spaces Taken": 10,
          "Spaces Left": 0,
          "Site": "CAT",
          "Member Count": 2,
          "Desk Count": 2
        },
        {
          "Room": "CAT - Office 5",
          "Required Fill": "£0.00",
          "Revenue": "£1,300.00",
          "Desk Price": "£162.50",
          "Spaces Taken": 8,
          "Spaces Left": 0,
          "Site": "CAT",
          "Member Count": 1,
          "Desk Count": 1
        },
        {
          "Room": "CAT - Office 6",
          "Required Fill": "£0.00",
          "Revenue": "£700.02",
          "Desk Price": "£116.67",
          "Spaces Taken": 6,
          "Spaces Left": 0,
          "Site": "CAT",
          "Member Count": 1,
          "Desk Count": 1
        },
        {
          "Room": "CAT - Office 7",
          "Required Fill": "£0.00",
          "Revenue": "£1,200.00",
          "Desk Price": "£150.00",
          "Spaces Taken": 8,
          "Spaces Left": 0,
          "Site": "CAT",
          "Member Count": 1,
          "Desk Count": 1
        },
        {
          "Room": "CAT - Office 8",
          "Required Fill": "£0.00",
          "Revenue": "£600.00",
          "Desk Price": "£100.00",
          "Spaces Taken": 6,
          "Spaces Left": 0,
          "Site": "CAT",
          "Member Count": 1,
          "Desk Count": 1
        },
        {
          "Room": "CAT - Office 9",
          "Required Fill": "£600.00",
          "Revenue": "£0.00",
          "Desk Price": "£120.00",
          "Spaces Taken": 0,
          "Spaces Left": 5,
          "Site": "CAT",
          "Member Count": 0,
          "Desk Count": 0
        },
        {
          "Room": "CHE - Main Room",
          "Required Fill": "£1,000.00",
          "Revenue": "£1,875.00",
          "Desk Price": "£125.00",
          "Spaces Taken": 15,
          "Spaces Left": 8,
          "Site": "CHE",
          "Member Count": 17,
          "Desk Count": 19
        },
        {
          "Room": "CHI - 1st Floor",
          "Required Fill": "£2,250.00",
          "Revenue": "£1,125.00",
          "Desk Price": "£125.00",
          "Spaces Taken": 9,
          "Spaces Left": 18,
          "Site": "CHI",
          "Member Count": 10,
          "Desk Count": 11
        },
        {
          "Room": "CHI 2nd Floor",
          "Required Fill": "£310.00",
          "Revenue": "£0.00",
          "Desk Price": "£155.00",
          "Spaces Taken": 0,
          "Spaces Left": 2,
          "Site": "CHI",
          "Member Count": 0,
          "Desk Count": 0
        },
        {
          "Room": "CHI 2nd Floor - Flexi",
          "Required Fill": "£750.00",
          "Revenue": "£1,125.00",
          "Desk Price": "£75.00",
          "Spaces Taken": 15,
          "Spaces Left": 10,
          "Site": "CHI",
          "Member Count": 13,
          "Desk Count": 13
        },
        {
          "Room": "HAN - HCC",
          "Required Fill": "£500.00",
          "Revenue": "£1,125.00",
          "Desk Price": "£125.00",
          "Spaces Taken": 9,
          "Spaces Left": 4,
          "Site": "HAN",
          "Member Count": 9,
          "Desk Count": 9
        },
        {
          "Room": "MAI - Flexi",
          "Required Fill": "£455.00",
          "Revenue": "£325.00",
          "Desk Price": "£65.00",
          "Spaces Taken": 5,
          "Spaces Left": 7,
          "Site": "MAI",
          "Member Count": 5,
          "Desk Count": 5
        },
        {
          "Room": "MAI - Main Room",
          "Required Fill": "£1,330.00",
          "Revenue": "£190.00",
          "Desk Price": "£95.00",
          "Spaces Taken": 2,
          "Spaces Left": 14,
          "Site": "MAI",
          "Member Count": 2,
          "Desk Count": 2
        },
        {
          "Room": "NHG - Carnival",
          "Required Fill": "£0.00",
          "Revenue": "£312.48",
          "Desk Price": "£104.16",
          "Spaces Taken": 3,
          "Spaces Left": 0,
          "Site": "NHG",
          "Member Count": 1,
          "Desk Count": 3
        },
        {
          "Room": "NHG - Goldfinger",
          "Required Fill": "£250.00",
          "Revenue": "£375.00",
          "Desk Price": "£125.00",
          "Spaces Taken": 3,
          "Spaces Left": 2,
          "Site": "NHG",
          "Member Count": 3,
          "Desk Count": 3
        },
        {
          "Room": "NHG - Orwell Main",
          "Required Fill": "£0.00",
          "Revenue": "£1,250.00",
          "Desk Price": "£125.00",
          "Spaces Taken": 10,
          "Spaces Left": 0,
          "Site": "NHG",
          "Member Count": 10,
          "Desk Count": 10
        },
        {
          "Room": "NHG - Panama",
          "Required Fill": "£0.00",
          "Revenue": "£695.00",
          "Desk Price": "£139.00",
          "Spaces Taken": 5,
          "Spaces Left": 0,
          "Site": "NHG",
          "Member Count": 3,
          "Desk Count": 7
        },
        {
          "Room": "NHG - Portabello",
          "Required Fill": "£0.00",
          "Revenue": "£395.01",
          "Desk Price": "£131.67",
          "Spaces Taken": 3,
          "Spaces Left": 0,
          "Site": "NHG",
          "Member Count": 2,
          "Desk Count": 4
        },
        {
          "Room": "RIV - Flexi",
          "Required Fill": "£1,125.00",
          "Revenue": "£750.00",
          "Desk Price": "£75.00",
          "Spaces Taken": 10,
          "Spaces Left": 15,
          "Site": "RIV",
          "Member Count": 9,
          "Desk Count": 10
        },
        {
          "Room": "RIV - Room 10",
          "Required Fill": "£0.00",
          "Revenue": "£0.00",
          "Desk Price": "£124.17",
          "Spaces Taken": 0,
          "Spaces Left": 0,
          "Site": "RIV",
          "Member Count": 0,
          "Desk Count": 0
        },
        {
          "Room": "RIV - Room 18 - Fixed",
          "Required Fill": "£460.00",
          "Revenue": "£345.00",
          "Desk Price": "£115.00",
          "Spaces Taken": 3,
          "Spaces Left": 4,
          "Site": "RIV",
          "Member Count": 3,
          "Desk Count": 3
        },
        {
          "Room": "RIV - Room 19",
          "Required Fill": "£0.00",
          "Revenue": "£735.00",
          "Desk Price": "£183.75",
          "Spaces Taken": 4,
          "Spaces Left": 0,
          "Site": "RIV",
          "Member Count": 3,
          "Desk Count": 5
        },
        {
          "Room": "RIV - Room 20 - Fixed",
          "Required Fill": "£230.00",
          "Revenue": "£345.00",
          "Desk Price": "£115.00",
          "Spaces Taken": 3,
          "Spaces Left": 2,
          "Site": "RIV",
          "Member Count": 3,
          "Desk Count": 3
        },
        {
          "Room": "RIV - Room 21 - Fixed",
          "Required Fill": "£0.00",
          "Revenue": "£460.00",
          "Desk Price": "£115.00",
          "Spaces Taken": 4,
          "Spaces Left": 0,
          "Site": "RIV",
          "Member Count": 3,
          "Desk Count": 3
        },
        {
          "Room": "RIV - Room 22",
          "Required Fill": "£0.00",
          "Revenue": "£600.00",
          "Desk Price": "£150.00",
          "Spaces Taken": 4,
          "Spaces Left": 0,
          "Site": "RIV",
          "Member Count": 1,
          "Desk Count": 4
        },
        {
          "Room": "RIV - Room 23",
          "Required Fill": "£0.00",
          "Revenue": "£745.00",
          "Desk Price": "£149.00",
          "Spaces Taken": 5,
          "Spaces Left": 0,
          "Site": "RIV",
          "Member Count": 1,
          "Desk Count": 5
        },
        {
          "Room": "RIV - Room 24",
          "Required Fill": "£0.00",
          "Revenue": "£345.00",
          "Desk Price": "£172.50",
          "Spaces Taken": 2,
          "Spaces Left": 0,
          "Site": "RIV",
          "Member Count": 1,
          "Desk Count": 2
        },
        {
          "Room": "RIV - Room 25",
          "Required Fill": "£0.00",
          "Revenue": "£444.99",
          "Desk Price": "£148.33",
          "Spaces Taken": 3,
          "Spaces Left": 0,
          "Site": "RIV",
          "Member Count": 1,
          "Desk Count": 3
        },
        {
          "Room": "RIV - Room 26",
          "Required Fill": "£0.00",
          "Revenue": "£545.00",
          "Desk Price": "£136.25",
          "Spaces Taken": 4,
          "Spaces Left": 0,
          "Site": "RIV",
          "Member Count": 3,
          "Desk Count": 5
        },
        {
          "Room": "RIV - Room 27",
          "Required Fill": "£0.00",
          "Revenue": "£545.00",
          "Desk Price": "£136.25",
          "Spaces Taken": 4,
          "Spaces Left": 0,
          "Site": "RIV",
          "Member Count": 2,
          "Desk Count": 4
        },
        {
          "Room": "RIV - Virtual",
          "Required Fill": "£0.00",
          "Revenue": "£310.00",
          "Desk Price": "£155.00",
          "Spaces Taken": 2,
          "Spaces Left": 0,
          "Site": "RIV",
          "Member Count": 2,
          "Desk Count": 2
        },
        {
          "Room": "RIV - William Penn",
          "Required Fill": "£0.00",
          "Revenue": "£0.00",
          "Desk Price": "£75.00",
          "Spaces Taken": 0,
          "Spaces Left": 0,
          "Site": "RIV",
          "Member Count": 0,
          "Desk Count": 0
        },
        {
          "Room": "WEL - Bolan",
          "Required Fill": "£0.00",
          "Revenue": "£2,180.00",
          "Desk Price": "£545.00",
          "Spaces Taken": 4,
          "Spaces Left": 0,
          "Site": "WEL",
          "Member Count": 1,
          "Desk Count": 4
        },
        {
          "Room": "WEL - Flexi",
          "Required Fill": "£650.00",
          "Revenue": "£130.00",
          "Desk Price": "£65.00",
          "Spaces Taken": 2,
          "Spaces Left": 10,
          "Site": "WEL",
          "Member Count": 4,
          "Desk Count": 4
        },
        {
          "Room": "WEL - IT Suite",
          "Required Fill": "£1,520.00",
          "Revenue": "£0.00",
          "Desk Price": "£95.00",
          "Spaces Taken": 0,
          "Spaces Left": 16,
          "Site": "WEL",
          "Member Count": 0,
          "Desk Count": 0
        },
        {
          "Room": "WEL - Main Room",
          "Required Fill": "£570.00",
          "Revenue": "£665.00",
          "Desk Price": "£95.00",
          "Spaces Taken": 7,
          "Spaces Left": 6,
          "Site": "WEL",
          "Member Count": 6,
          "Desk Count": 9
        },
        {
          "Room": "WEL - Virtual",
          "Required Fill": "£155.00",
          "Revenue": "£0.00",
          "Desk Price": "£155.00",
          "Spaces Taken": 0,
          "Spaces Left": 1,
          "Site": "WEL",
          "Member Count": 0,
          "Desk Count": 0
        },
        {
          "Room": "WIM - Flexi",
          "Required Fill": "£255.00",
          "Revenue": "£2,295.00",
          "Desk Price": "£85.00",
          "Spaces Taken": 27,
          "Spaces Left": 3,
          "Site": "WIM",
          "Member Count": 27,
          "Desk Count": 27
        },
        {
          "Room": "WIM - Gallery",
          "Required Fill": "£1,110.00",
          "Revenue": "£3,330.00",
          "Desk Price": "£185.00",
          "Spaces Taken": 18,
          "Spaces Left": 6,
          "Site": "WIM",
          "Member Count": 16,
          "Desk Count": 19
        },
        {
          "Room": "WIM - Zone 1 - Red Room",
          "Required Fill": "£1,029.00",
          "Revenue": "£885.00",
          "Desk Price": "£147.50",
          "Spaces Taken": 6,
          "Spaces Left": 7,
          "Site": "WIM",
          "Member Count": 6,
          "Desk Count": 6
        },
        {
          "Room": "WIM - Zone 2 - Banner",
          "Required Fill": "£0.00",
          "Revenue": "£0.00",
          "Desk Price": "£0.00",
          "Spaces Taken": 0,
          "Spaces Left": 0,
          "Site": "WIM",
          "Member Count": 0,
          "Desk Count": 0
        },
        {
          "Room": "WIM - Zone 2 - Darkholme",
          "Required Fill": "£0.00",
          "Revenue": "£1,250.00",
          "Desk Price": "£250.00",
          "Spaces Taken": 5,
          "Spaces Left": 0,
          "Site": "WIM",
          "Member Count": 2,
          "Desk Count": 5
        },
        {
          "Room": "WIM - Zone 2 - Logan",
          "Required Fill": "£555.00",
          "Revenue": "£925.00",
          "Desk Price": "£185.00",
          "Spaces Taken": 5,
          "Spaces Left": 3,
          "Site": "WIM",
          "Member Count": 5,
          "Desk Count": 5
        },
        {
          "Room": "WIM - Zone 2 - Romanova",
          "Required Fill": "£2,058.00",
          "Revenue": "£0.00",
          "Desk Price": "£147.50",
          "Spaces Taken": 0,
          "Spaces Left": 14,
          "Site": "WIM",
          "Member Count": 0,
          "Desk Count": 0
        },
        {
          "Room": "WIM - Zone 2 - Stark",
          "Required Fill": "£0.00",
          "Revenue": "£845.00",
          "Desk Price": "£169.00",
          "Spaces Taken": 5,
          "Spaces Left": 0,
          "Site": "WIM",
          "Member Count": 5,
          "Desk Count": 5
        },
        {
          "Room": "WIM - Zone 2 - Thor",
          "Required Fill": "£294.00",
          "Revenue": "£1,475.00",
          "Desk Price": "£147.50",
          "Spaces Taken": 10,
          "Spaces Left": 2,
          "Site": "WIM",
          "Member Count": 3,
          "Desk Count": 10
        }
      ]
    
    
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
