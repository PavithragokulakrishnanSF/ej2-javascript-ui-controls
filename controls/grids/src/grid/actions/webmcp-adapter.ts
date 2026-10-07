import { isNullOrUndefined } from '@syncfusion/ej2-base';
import { Grid } from '../base/grid';
import { WebMcpTool, WebMcpToolExecuteEventArgs, WebMcpToolResponse, ISelectedCell } from '../base/interface';

type ToolArgs = Record<string, unknown>;

const EVENT_GET_TOOLS: string = 'getWebMcpTools';
const EVENT_REGISTER_TOOLS: string = 'registerWebMcpTools';
const EVENT_BEFORE_EXECUTE: string = 'beforeWebMcpToolExecute';

const webMcpTools: WebMcpTool[] = [
    {
        name: 'getSelectedRecords',
        description: 'Returns the selected Grid records.',
        annotations: { readOnlyHint: true },
        inputSchema: { type: 'object', properties: {}, required: [] },
        outputSchema: { type: 'object', properties: { selectedRecords: { type: 'array' } }, required: ['selectedRecords'] }
    },
    {
        name: 'getSelectedRowIndexes',
        description: 'Returns the selected row indexes from the Grid.',
        annotations: { readOnlyHint: true },
        inputSchema: { type: 'object', properties: {}, required: [] },
        outputSchema: { type: 'object', properties: { selectedRowIndexes: { type: 'array' } }, required: ['selectedRowIndexes'] }
    },
    {
        name: 'navigateToPage',
        description: 'Navigates the Grid to a specific page.',
        annotations: { readOnlyHint: false },
        inputSchema: {
            type: 'object',
            properties: {
                pageNo: { type: 'number' },
                waitForCompletion: { type: 'boolean' }
            },
            required: ['pageNo']
        },
        outputSchema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'sortByColumn',
        description: 'Sorts the Grid by a column.',
        annotations: { readOnlyHint: false },
        inputSchema: {
            type: 'object',
            properties: {
                columnName: { type: 'string' },
                direction: { type: 'string' },
                isMultiSort: { type: 'boolean' },
                waitForCompletion: { type: 'boolean' }
            },
            required: ['columnName', 'direction']
        },
        outputSchema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'clearSorting',
        description: 'Clears sorting from the Grid.',
        annotations: { readOnlyHint: false },
        inputSchema: { type: 'object', properties: {}, required: [] },
        outputSchema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'filterByColumn',
        description: 'Applies a filter to a Grid column.',
        annotations: { readOnlyHint: false },
        inputSchema: {
            type: 'object',
            properties: {
                fieldName: { type: 'string' },
                filterOperator: { type: 'string' },
                filterValue: {},
                predicate: { type: 'string' },
                matchCase: { type: 'boolean' },
                ignoreAccent: { type: 'boolean' },
                waitForCompletion: { type: 'boolean' }
            },
            required: ['fieldName', 'filterOperator', 'filterValue']
        },
        outputSchema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'clearFiltering',
        description: 'Clears filtering from the Grid.',
        annotations: { readOnlyHint: false },
        inputSchema: { type: 'object', properties: {}, required: [] },
        outputSchema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'setRowData',
        description: 'Sets row data by key.',
        annotations: { readOnlyHint: false },
        inputSchema: {
            type: 'object',
            properties: {
                key: {},
                rowData: { type: 'object' },
                waitForCompletion: { type: 'boolean' },
                delay: { type: 'number' }
            },
            required: ['key']
        },
        outputSchema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'setCellValue',
        description: 'Updates a single Grid cell value.',
        annotations: { readOnlyHint: false },
        inputSchema: {
            type: 'object',
            properties: {
                key: {},
                field: { type: 'string' },
                value: {}
            },
            required: ['key', 'field', 'value']
        },
        outputSchema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'saveBulkChanges',
        description: 'Persists a set of edited Grid rows.',
        annotations: { readOnlyHint: false },
        inputSchema: {
            type: 'object',
            properties: {
                changedData: { type: 'object' },
                rowData: { type: 'array' },
                waitForCompletion: { type: 'boolean' }
            },
            required: ['changedData']
        },
        outputSchema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'changeDataSource',
        description: 'Replaces or updates the Grid data source.',
        annotations: { readOnlyHint: false },
        inputSchema: {
            type: 'object',
            properties: {
                dataSource: {},
                columns: {},
                properties: { type: 'object' }
            },
            required: []
        },
        outputSchema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'getCurrentViewRecords',
        description: 'Returns the current visible Grid records.',
        annotations: { readOnlyHint: true },
        inputSchema: { type: 'object', properties: {}, required: [] },
        outputSchema: { type: 'object', properties: { currentViewRecords: { type: 'array' } }, required: ['currentViewRecords'] }
    },
    {
        name: 'getFilteredRecords',
        description: 'Returns records that match current Grid filters.',
        annotations: { readOnlyHint: true },
        inputSchema: {
            type: 'object',
            properties: { waitForPromise: { type: 'boolean' } },
            required: []
        },
        outputSchema: { type: 'object', properties: { filteredRecords: { type: 'array' } }, required: ['filteredRecords'] }
    },
    {
        name: 'selection',
        description: 'Performs common Grid selection operations.',
        annotations: { readOnlyHint: false },
        inputSchema: {
            type: 'object',
            properties: {
                mode: { type: 'string', enum: ['selectRows', 'selectRow', 'selectCells'] },
                indexes: { type: 'array', items: { type: 'number' }, description: 'Row indexes for selectRows.' },
                index: { type: 'number', description: 'Row index for selectRow.' },
                cellIndexes: { type: 'array', description: 'Cell indexes for selectCells.' }
            },
            required: ['mode']
        },
        outputSchema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'selectRowByRange',
        description: 'Selects row(s) within a range.',
        annotations: { readOnlyHint: false },
        inputSchema: {
            type: 'object',
            properties: {
                startIndex: { type: 'number' },
                endIndex: { type: 'number' },
                waitForCompletion: { type: 'boolean' }
            },
            required: ['startIndex']
        },
        outputSchema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'clearSelection',
        description: 'Clears all Grid selection.',
        annotations: { readOnlyHint: false },
        inputSchema: { type: 'object', properties: {}, required: [] },
        outputSchema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'exports',
        description: 'Exports Grid data to a file format.',
        annotations: { readOnlyHint: false },
        inputSchema: {
            type: 'object',
            properties: {
                exportType: { type: 'string', enum: ['excel', 'csv', 'pdf'] },
                exportOptions: { type: 'object', description: 'Export properties (ExcelExportProperties, CsvExportProperties, or PdfExportProperties).' },
                waitForCompletion: { type: 'boolean' }
            },
            required: ['exportType']
        },
        outputSchema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'crudLifecycle',
        description: 'Performs common CRUD or edit lifecycle operations.',
        annotations: { readOnlyHint: false },
        inputSchema: {
            type: 'object',
            properties: {
                mode: { type: 'string', enum: ['startEdit', 'endEdit', 'closeEdit', 'addRecord', 'deleteRecord'] },
                data: { type: 'object', description: 'Record for addRecord/deleteRecord.' },
                index: { type: 'number', description: 'Row index for addRecord.' },
                fieldname: { type: 'string', description: 'Field name for deleteRecord.' }
            },
            required: ['mode']
        },
        outputSchema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'layoutContent',
        description: 'Controls Grid layout and content utilities.',
        annotations: { readOnlyHint: false },
        inputSchema: {
            type: 'object',
            properties: {
                mode: { type: 'string', enum: ['refresh', 'refreshColumns', 'showSpinner', 'hideSpinner'] },
                elementId: { type: 'string' },
                dialogOptions: { type: 'object' }
            },
            required: ['mode']
        },
        outputSchema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'columnVisibility',
        description: 'Shows or hides Grid columns and opens the chooser.',
        annotations: { readOnlyHint: false },
        inputSchema: {
            type: 'object',
            properties: {
                mode: { type: 'string', enum: ['showColumns', 'hideColumns', 'openColumnChooser'] },
                keys: { type: 'array', items: { type: 'string' }, description: 'Column keys (field names or header text).' },
                showBy: { type: 'string', description: 'Field key or header text key identifier.' },
                hideBy: { type: 'string', description: 'Field key or header text key identifier.' }
            },
            required: ['mode']
        },
        outputSchema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'selectionRangeHelpers',
        description: 'Provides selection range helpers and selection clearing.',
        annotations: { readOnlyHint: false },
        inputSchema: {
            type: 'object',
            properties: {
                mode: { type: 'string', enum: ['clearCellSelection', 'clearRowSelection'] },
                startIndex: {},
                endIndex: {},
                waitForCompletion: { type: 'boolean' }
            },
            required: ['mode']
        },
        outputSchema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'refreshAndSizing',
        description: 'Refreshes Grid content and applies sizing operations.',
        annotations: { readOnlyHint: false },
        inputSchema: {
            type: 'object',
            properties: {
                fieldNames: { type: 'array', items: { type: 'string' }, description: 'Column fields to auto-fit.' },
                startRowIndex: { type: 'number' },
                endRowIndex: { type: 'number' },
                mode: { type: 'string', enum: ['autoFitColumns', 'refresh', 'refreshHeader'] }
            },
            required: ['mode']
        },
        outputSchema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'reorderData',
        description: 'Reorders Grid columns or rows.',
        annotations: { readOnlyHint: false },
        inputSchema: {
            type: 'object',
            properties: {
                mode: { type: 'string', enum: ['reorderColumns', 'reorderColumnByIndex', 'reorderRows'] },
                fromIndex: { type: 'number' },
                toIndex: { type: 'number' },
                fromFName: { type: 'string', description: 'Origin field name.' },
                toFName: { type: 'string', description: 'Destination field name.' },
                fromIndexes: { type: 'array', items: { type: 'number' }, description: 'Origin row indexes for reorderRows.' }
            },
            required: ['mode']
        },
        outputSchema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'groupingAndPinning',
        description: 'Groups or ungroups data, handles detail rows, and pins rows.',
        annotations: { readOnlyHint: false },
        inputSchema: {
            type: 'object',
            properties: {
                mode: {
                    type: 'string',
                    enum: ['groupColumn', 'ungroupColumn', 'clearGrouping', 'groupExpandAll', 'groupCollapseAll', 'pinRows', 'unpinRows']
                },
                columnName: { type: 'string' },
                data: { type: 'array', description: 'Records to pin or unpin.' }
            },
            required: ['mode']
        },
        outputSchema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'batchChanges',
        description: 'Reads or applies Grid batch changes.',
        annotations: { readOnlyHint: false },
        inputSchema: {
            type: 'object',
            properties: {
                mode: { type: 'string', enum: ['getBatchChanges', 'batchSave', 'saveBatchChanges'] },
                changes: { type: 'object', description: 'Field-value pairs to save in bulk.' },
                waitForCompletion: { type: 'boolean' }
            },
            required: ['mode']
        },
        outputSchema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'configurationHelpers',
        description: 'Exposes configuration and helper getters for the Grid.',
        annotations: { readOnlyHint: true },
        inputSchema: {
            type: 'object',
            properties: {
                mode: {
                    type: 'string',
                    enum: ['getColumns', 'getColumnByField', 'getColumnByUid', 'getPrimaryKeyFieldNames',
                        'getColumnFieldNames', 'getVisibleColumns']
                },
                field: { type: 'string' },
                uid: { type: 'string' }
            },
            required: ['mode']
        },
        outputSchema: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'toolbarClipboardUtilities',
        description: 'Enables toolbar items and supports copy or print utilities.',
        annotations: { readOnlyHint: false },
        inputSchema: {
            type: 'object',
            properties: {
                mode: { type: 'string', enum: ['enableToolbarItems', 'copy', 'print'] },
                items: { type: 'array', items: { type: 'string' } },
                isEnable: { type: 'boolean' },
                withHeader: { type: 'boolean' }
            },
            required: ['mode']
        },
        outputSchema: { type: 'object', properties: {}, required: [] }
    }
];

export class WebMcpGrid {
    private parent: Grid;
    private webMcpAbortController: AbortController | null = null;

    constructor(parent: Grid) {
        this.parent = parent;
        this.addEventListener();
    }

    private addEventListener(): void {
        this.parent.on(EVENT_GET_TOOLS, this.getTools, this);
        this.parent.on(EVENT_REGISTER_TOOLS, this.registerTools, this);
        this.parent.on(EVENT_BEFORE_EXECUTE, this.executeHandler, this);
    }

    private removeEventListener(): void {
        if (!this.parent.isDestroyed) {
            this.parent.off(EVENT_GET_TOOLS, this.getTools);
            this.parent.off(EVENT_REGISTER_TOOLS, this.registerTools);
            this.parent.off(EVENT_BEFORE_EXECUTE, this.executeHandler);
        }
    }

    private getTools(args: { toolNames?: string[]; tools?: WebMcpTool[] }): WebMcpTool[] {
        const toolNames: string[] = args.toolNames || [];
        if (toolNames.length !== 0) {
            args.tools = webMcpTools
                .filter((tool: WebMcpTool) => toolNames.indexOf(tool.name) !== -1)
                .map((tool: WebMcpTool) => ({ ...tool }));
        } else {
            args.tools = webMcpTools.map((tool: WebMcpTool) => ({ ...tool }));
        }
        return args.tools;
    }

    private registerTools(args: { prefix?: string; tools?: string[] | WebMcpTool[]; exposedTo?: string[] }): void {
        const modelContext: { registerTool: Function } =
            <{ registerTool: Function }>(document as { modelContext?: { registerTool: Function } }).modelContext;
        if (!modelContext || typeof modelContext.registerTool !== 'function') {
            return;
        }
        this.webMcpAbortController = new AbortController();
        const toolPrefix: string = (isNullOrUndefined(args.prefix) ? this.parent.element.id : args.prefix) as string;
        const tools: WebMcpTool[] =
            args.tools && args.tools.length && typeof args.tools[0] === 'object'
                ? (args.tools as WebMcpTool[])
                : this.getTools({ toolNames: args.tools as string[] });

        tools.forEach((tool: WebMcpTool): void => {
            tool.name = `${toolPrefix}_${tool.name}`;
            tool.execute = tool.execute || ((toolArgs: object) => this.executeHandler(tool.name, toolArgs as ToolArgs || {}));
            const registerOptions: { signal: AbortSignal; exposedTo?: string[] } = {
                signal: (<AbortController>this.webMcpAbortController).signal
            };
            if (Array.isArray(args.exposedTo) && args.exposedTo.length > 0) {
                registerOptions.exposedTo = args.exposedTo;
            }
            (modelContext.registerTool as Function)(tool, registerOptions);
        });
    }

    private async executeHandler(command: string, args: ToolArgs): Promise<WebMcpToolResponse> {
        try {
            const baseCommand: string = command.includes('_') ? command.substring(command.indexOf('_') + 1) : command;
            const toolDef: WebMcpTool | undefined = webMcpTools.find((t: WebMcpTool) => t.name === baseCommand);
            const eventArgs: WebMcpToolExecuteEventArgs = { toolName: command, toolArgs: args };

            this.parent.trigger(EVENT_BEFORE_EXECUTE, eventArgs);

            if (eventArgs.cancel) {
                return this.message({
                    action: baseCommand,
                    cancelled: true,
                    message: eventArgs.cancellationResponse || `[USER_CANCELLED] Tool "${baseCommand}" was cancelled. This is final. Do NOT retry.`
                });
            }

            const readOnlyHint: boolean = !!(toolDef && (toolDef.annotations as { readOnlyHint?: boolean }).readOnlyHint);
            if (!readOnlyHint && eventArgs.showConfirmationDialog) {
                const summary: string = this.buildConfirmationMessage(baseCommand, args);
                const approved: boolean = await this.requestConfirmation(baseCommand, args, summary);
                if (!approved) {
                    return this.message({
                        action: baseCommand,
                        cancelled: true,
                        message: eventArgs.cancellationResponse || `[USER_CANCELLED] User denied: "${summary}". This is final. Do NOT retry.`
                    });
                }
            }

            switch (baseCommand) {
            case 'getSelectedRecords':
                return this.message({ selectedRecords: this.parent.getSelectedRecords ? this.parent.getSelectedRecords() : [] });
            case 'getSelectedRowIndexes':
                return this.message({ selectedRowIndexes: this.parent.getSelectedRowIndexes ? this.parent.getSelectedRowIndexes() : [] });
            case 'navigateToPage': {
                if (args.waitForCompletion) {
                    await this.parent.goToPageAsync((args.pageNo as number) || 1);
                } else {
                    this.parent.goToPage((args.pageNo as number) || 1);
                }
                return this.message({ pageNo: (args.pageNo as number) || 1 });
            }
            case 'sortByColumn': {
                const direction: 'Ascending' | 'Descending' = (args.direction as 'Ascending' | 'Descending') || 'Ascending';
                const isMultiSort: boolean = !!(args.isMultiSort as boolean);
                if (args.waitForCompletion) {
                    await this.parent.sortColumnAsync(args.columnName as string, direction, isMultiSort);
                } else {
                    this.parent.sortColumn(args.columnName as string, direction, isMultiSort);
                }
                return this.message({ sortedBy: args.columnName as string, direction: direction });
            }
            case 'clearSorting':
                if (args.waitForCompletion) {
                    await this.parent.clearSortingAsync();
                } else {
                    this.parent.clearSorting();
                }
                return this.message({ sortingCleared: true });
            case 'filterByColumn': {
                const matchCase: boolean = !!(args.matchCase as boolean);
                const ignoreAccent: boolean = !!(args.ignoreAccent as boolean);
                const predicate: string = (args.predicate as string) || 'and';
                if (Array.isArray(args.filterValue)) {
                    const filterValue: string[] | number[] | Date[] | boolean[] =
                        args.filterValue as string[] | number[] | Date[] | boolean[];
                    if (args.waitForCompletion) {
                        await this.parent.filterByColumnAsync(
                            args.fieldName as string, args.filterOperator as string, filterValue,
                            predicate, matchCase, ignoreAccent);
                    } else {
                        this.parent.filterByColumn(
                            args.fieldName as string, args.filterOperator as string, filterValue,
                            predicate, matchCase, ignoreAccent);
                    }
                } else {
                    if (args.waitForCompletion) {
                        await this.parent.filterByColumnAsync(
                            args.fieldName as string, args.filterOperator as string,
                            args.filterValue as string | number | boolean | Date | null,
                            predicate, matchCase, ignoreAccent);
                    } else {
                        this.parent.filterByColumn(
                            args.fieldName as string, args.filterOperator as string,
                            args.filterValue as string | number | boolean | Date | null,
                            predicate, matchCase, ignoreAccent);
                    }
                }
                return this.message({ filteredBy: args.fieldName as string });
            }
            case 'clearFiltering':
                if (args.waitForCompletion) {
                    await this.parent.clearFilteringAsync(args.fields as string[]);
                } else {
                    this.parent.clearFiltering(args.fields as string[]);
                }
                return this.message({ filteringCleared: true });
            case 'setRowData':
                if (args.waitForCompletion) {
                    await this.parent.setRowDataAsync(args.key as string | number, args.rowData as object, args.delay as number);
                } else {
                    this.parent.setRowData(args.key as string | number, args.rowData as object);
                }
                return this.message({ rowDataUpdated: true, key: args.key });
            case 'setCellValue':
                this.parent.setCellValue(args.key as string | number, args.field as string,
                                         args.value as string | number | boolean | Date | null);
                return this.message({ cellValueUpdated: true, key: args.key, field: args.field });
            case 'saveBulkChanges':
                this.parent.saveBulkChanges(args.changedData as object, args.rowData as object[]);
                return this.message({ bulkChangesSaved: true });
            case 'changeDataSource':
                this.parent.changeDataSource(args.dataSource as object, args.columns as string[], args.properties as object);
                return this.message({ dataSourceChanged: true });
            case 'getCurrentViewRecords':
                return this.message({ currentViewRecords: this.parent.getCurrentViewRecords() });
            case 'getFilteredRecords': {
                const filteredRecords: Object[] | Promise<Object> = this.parent.getFilteredRecords();
                const result: unknown = (filteredRecords instanceof Promise) && (args.waitForPromise as boolean)
                    ? await filteredRecords
                    : filteredRecords;
                return this.message({ filteredRecords: result });
            }
            case 'selection': {
                const selectionArgs: {
                    mode?: string, indexes?: number[], index?: number,
                    cellIndexes?: ISelectedCell[]
                } = args as {
                    mode?: string, indexes?: number[], index?: number,
                    cellIndexes?: ISelectedCell[]
                };
                switch (selectionArgs.mode) {
                case 'selectRows':
                    this.parent.selectRows(selectionArgs.indexes as number[]);
                    break;
                case 'selectRow':
                    this.parent.selectRow(selectionArgs.index as number);
                    break;
                case 'selectCells':
                    this.parent.selectCells(selectionArgs.cellIndexes as ISelectedCell[]);
                    break;
                default:
                    return this.error(`Unknown selection mode: "${selectionArgs.mode}"`);
                }
                return this.message({});
            }
            case 'selectRowByRange':
                this.parent.selectRowsByRange(args.startIndex as number, args.endIndex as number);
                return this.message({ selectedRange: args.startIndex + '-' + (args.endIndex as number) });
            case 'clearSelection':
                this.parent.clearSelection();
                return this.message({ selectionCleared: true });
            case 'exports': {
                const exportType: string = (args.exportType as string).toLowerCase();
                const exportOptions: object = args.exportOptions as object;
                if (exportType === 'excel') {
                    const exportResult: Object = await this.parent.excelExport(exportOptions);
                    return this.message({ exportResult });
                } else if (exportType === 'csv') {
                    const exportResult: Object = await this.parent.csvExport(exportOptions);
                    return this.message({ exportResult });
                } else if (exportType === 'pdf') {
                    const exportResult: Object = await this.parent.pdfExport(exportOptions);
                    return this.message({ exportResult });
                } else {
                    return this.error(`Unknown export type: "${exportType}"`);
                }
            }
            case 'crudLifecycle': {
                const crudArgs: { mode?: string, data?: object, index?: number, fieldname?: string } = args as {
                    mode?: string, data?: object, index?: number, fieldname?: string
                };
                switch (crudArgs.mode) {
                case 'startEdit':
                    this.parent.startEdit();
                    break;
                case 'endEdit':
                    this.parent.endEdit();
                    break;
                case 'closeEdit':
                    this.parent.closeEdit();
                    break;
                case 'addRecord':
                    this.parent.addRecord(crudArgs.data as object, crudArgs.index as number);
                    break;
                case 'deleteRecord':
                    this.parent.deleteRecord(crudArgs.fieldname, crudArgs.data as object);
                    break;
                default:
                    return this.error(`Unknown CRUD lifecycle mode: "${crudArgs.mode}"`);
                }
                return this.message({});
            }
            case 'layoutContent': {
                const layoutArgs: { mode?: string, elementId?: string, dialogOptions?: object } = args as {
                    mode?: string, elementId?: string, dialogOptions?: object
                };
                switch (layoutArgs.mode) {
                case 'refresh':
                    this.parent.refresh();
                    break;
                case 'refreshColumns':
                    this.parent.refreshColumns();
                    break;
                case 'showSpinner':
                    this.parent.showSpinner();
                    break;
                case 'hideSpinner':
                    this.parent.hideSpinner();
                    break;
                default:
                    return this.error(`Unknown layout mode: "${layoutArgs.mode}"`);
                }
                return this.message({});
            }
            case 'columnVisibility': {
                const visibilityArgs: { mode?: string, keys?: string | string[], showBy?: string, hideBy?: string } = args as {
                    mode?: string, keys?: string | string[], showBy?: string, hideBy?: string
                };
                switch (visibilityArgs.mode) {
                case 'showColumns':
                    this.parent.showColumns(visibilityArgs.keys as string, visibilityArgs.showBy as string);
                    break;
                case 'hideColumns':
                    this.parent.hideColumns(visibilityArgs.keys as string, visibilityArgs.hideBy as string);
                    break;
                case 'openColumnChooser':
                    this.parent.openColumnChooser(0, 0);
                    break;
                default:
                    return this.error(`Unknown column visibility mode: "${visibilityArgs.mode}"`);
                }
                return this.message({});
            }
            case 'selectionRangeHelpers': {
                const rangeArgs: { mode?: string, startIndex?: number, endIndex?: number } =
                    args as { mode?: string, startIndex?: number, endIndex?: number };
                switch (rangeArgs.mode) {
                case 'clearCellSelection':
                    this.parent.clearCellSelection();
                    break;
                case 'clearRowSelection':
                    this.parent.clearRowSelection();
                    break;
                default:
                    return this.error(`Unknown selection range mode: "${rangeArgs.mode}"`);
                }
                return this.message({});
            }
            case 'refreshAndSizing': {
                const sizingArgs: { mode?: string, fieldNames?: string | string[], startRowIndex?: number, endRowIndex?: number } =
                    args as {
                        mode?: string, fieldNames?: string | string[], startRowIndex?: number, endRowIndex?: number
                    };
                switch (sizingArgs.mode) {
                case 'autoFitColumns':
                    this.parent.autoFitColumns(sizingArgs.fieldNames, sizingArgs.startRowIndex, sizingArgs.endRowIndex);
                    break;
                case 'refresh':
                    this.parent.refresh();
                    break;
                case 'refreshHeader':
                    this.parent.refreshHeader();
                    break;
                default:
                    return this.error(`Unknown refresh/sizing mode: "${sizingArgs.mode}"`);
                }
                return this.message({});
            }
            case 'reorderData': {
                const reorderArgs: {
                    mode?: string, fromIndex?: number, toIndex?: number,
                    fromFName?: string, toFName?: string, fromIndexes?: number[]
                } = args as {
                    mode?: string, fromIndex?: number, toIndex?: number,
                    fromFName?: string, toFName?: string, fromIndexes?: number[]
                };
                switch (reorderArgs.mode) {
                case 'reorderColumns':
                    this.parent.reorderColumns(reorderArgs.fromFName as string, reorderArgs.toFName as string);
                    break;
                case 'reorderColumnByIndex':
                    this.parent.reorderColumnByIndex(reorderArgs.fromIndex as number, reorderArgs.toIndex as number);
                    break;
                case 'reorderRows':
                    this.parent.reorderRows(reorderArgs.fromIndexes as number[], reorderArgs.toIndex as number);
                    break;
                default:
                    return this.error(`Unknown reorder mode: "${reorderArgs.mode}"`);
                }
                return this.message({});
            }
            case 'groupingAndPinning': {
                const groupArgs: { mode?: string, columnName?: string, data?: object[] } = args as {
                    mode?: string, columnName?: string, data?: object[]
                };
                switch (groupArgs.mode) {
                case 'groupColumn':
                    this.parent.groupColumn(groupArgs.columnName as string);
                    break;
                case 'ungroupColumn':
                    this.parent.ungroupColumn(groupArgs.columnName as string);
                    break;
                case 'clearGrouping':
                    this.parent.clearGrouping();
                    break;
                case 'groupExpandAll':
                    this.parent.groupExpandAll();
                    break;
                case 'groupCollapseAll':
                    this.parent.groupCollapseAll();
                    break;
                case 'pinRows':
                    this.parent.pinRows(groupArgs.data as Object[]);
                    break;
                case 'unpinRows':
                    this.parent.unpinRows(groupArgs.data as Object[]);
                    break;
                default:
                    return this.error(`Unknown grouping/pinning mode: "${groupArgs.mode}"`);
                }
                return this.message({});
            }
            case 'batchChanges': {
                const batchArgs: { mode?: string, changes?: object, waitForCompletion?: boolean } = args as {
                    mode?: string, changes?: object, waitForCompletion?: boolean
                };
                if (batchArgs.mode === 'getBatchChanges') {
                    return this.message({ batchChanges: this.parent.getBatchChanges() });
                } else if (batchArgs.mode === 'batchSave' || batchArgs.mode === 'saveBatchChanges') {
                    this.parent.saveBulkChanges(batchArgs.changes as object);
                    return this.message({ batchChangesSaved: true });
                } else {
                    return this.error(`Unknown batch mode: "${batchArgs.mode}"`);
                }
            }
            case 'configurationHelpers': {
                const configArgs: { mode?: string, field?: string, uid?: string } =
                    args as { mode?: string, field?: string, uid?: string };
                switch (configArgs.mode) {
                case 'getColumns':
                    return this.message({ columns: this.parent.getColumns() });
                case 'getColumnByField':
                    return this.message({ column: this.parent.getColumnByField(configArgs.field as string) });
                case 'getColumnByUid':
                    return this.message({ column: this.parent.getColumnByUid(configArgs.uid as string) });
                case 'getPrimaryKeyFieldNames':
                    return this.message({ primaryKeyFieldNames: this.parent.getPrimaryKeyFieldNames() });
                case 'getColumnFieldNames':
                    return this.message({ columnFieldNames: this.parent.getColumnFieldNames() });
                case 'getVisibleColumns':
                    return this.message({ visibleColumns: this.parent.getVisibleColumns() });
                default:
                    return this.error(`Unknown configuration helper mode: "${configArgs.mode}"`);
                }
            }
            case 'toolbarClipboardUtilities': {
                const utilityArgs: { mode?: string, items?: string[], isEnable?: boolean, withHeader?: boolean } = args as {
                    mode?: string, items?: string[], isEnable?: boolean, withHeader?: boolean
                };
                switch (utilityArgs.mode) {
                case 'enableToolbarItems':
                    this.parent.enableToolbarItems(utilityArgs.items as string[], !!(utilityArgs.isEnable));
                    break;
                case 'copy':
                    this.parent.copy(!!(utilityArgs.withHeader));
                    break;
                case 'print':
                    this.parent.print();
                    break;
                default:
                    return this.error(`Unknown toolbar/clipboard utility mode: "${utilityArgs.mode}"`);
                }
                return this.message({});
            }
            default:
                return this.error(`Tool "${baseCommand}" not found.`);
            }
        } catch (e) {
            const errorMessage: string = e instanceof Error ? e.message : 'Tool execution failed';
            return this.error(errorMessage);
        }
    }

    private buildConfirmationMessage(command: string, args: ToolArgs): string {
        return `Confirm: ${command} with args: ${JSON.stringify(args || {})}`;
    }

    private async requestConfirmation(_command: string, _args: ToolArgs, _message: string): Promise<boolean> {
        void _command;
        void _args;
        void _message;
        return true;
    }

    private message(data: unknown): WebMcpToolResponse {
        return { content: [{ type: 'text', text: JSON.stringify(data) }] };
    }

    private error(text: string): WebMcpToolResponse {
        return { content: [{ type: 'text', text }], isError: true };
    }

    public destroy(): void {
        this.removeEventListener();
        if (this.webMcpAbortController) {
            this.webMcpAbortController.abort();
            this.webMcpAbortController = null;
        }
    }

    public getModuleName(): string {
        return 'webMcpGrid';
    }
}
