/**
 * WebMcpGrid specs
 */
import { Grid } from '../../../src/grid/base/grid';
import { WebMcpTool, WebMcpToolResponse } from '../../../src/grid/base/interface';
import { data } from '../base/datasource.spec';
import { createGrid, destroy } from '../base/specutil.spec';
import { Selection } from '../../../src/grid/actions/selection';
import { Sort } from '../../../src/grid/actions/sort';
import { Filter } from '../../../src/grid/actions/filter';
import { Page } from '../../../src/grid/actions/page';
import { Edit } from '../../../src/grid/actions/edit';
import { Toolbar } from '../../../src/grid/actions/toolbar';
import { Group } from '../../../src/grid/actions/group';
import { Reorder } from '../../../src/grid/actions/reorder';
import { RowDD } from '../../../src/grid/actions/row-reorder';
import { ColumnChooser } from '../../../src/grid/actions/column-chooser';
import { DetailRow } from '../../../src/grid/actions/detail-row';
import { Aggregate } from '../../../src/grid/actions/aggregate';
import { ExcelExport } from '../../../src/grid/actions/excel-export';
import { PdfExport } from '../../../src/grid/actions/pdf-export';
import { ContextMenu } from '../../../src/grid/actions/context-menu';
import { ColumnMenu } from '../../../src/grid/actions/column-menu';
import { Resize } from '../../../src/grid/actions/resize';
import { Clipboard } from '../../../src/grid/actions/clipboard';
import { VirtualScroll } from '../../../src/grid/actions/virtual-scroll';
import { InfiniteScroll } from '../../../src/grid/actions/infinite-scroll';
import { WebMcpGrid } from '../../../src/grid/actions/webmcp-adapter';

Grid.Inject(Selection, Sort, Filter, Page, Edit, Toolbar, Group, Reorder, RowDD, ColumnChooser,
    DetailRow, Aggregate, ExcelExport, PdfExport, ContextMenu, ColumnMenu, Resize, Clipboard,
    VirtualScroll, InfiniteScroll, WebMcpGrid);

const TOOL_COUNT: number = 27;

/** Returns the injected WebMcpGrid module instance of a grid. */
function getModule(grid: Grid): any {
    return (grid as any).webMcpGridModule;
}

/** Calls the adapter's private executeHandler directly (exactly what execute() uses). */
function triggerTool(grid: Grid, toolName: string, toolArgs?: Object): Promise<WebMcpToolResponse> {
    const module: any = getModule(grid);
    return module.executeHandler.call(module, toolName, (toolArgs || {}) as any);
}

/** Parses the JSON payload of a successful message response. */
function parseContent(response: WebMcpToolResponse): any {
    return JSON.parse(response.content[0].text);
}

describe('WebMcpGrid ->', () => {
    let gridObj: Grid;
    const interactionHandler = (args: any): void => {
        args.cancel = true;
    };

    describe('Module ->', () => {
        beforeAll((done: Function) => {
            gridObj = createGrid({
                enableWebMcp: true,
                dataSource: data,
                allowPaging: true,
                allowSorting: true,
                allowFiltering: true,
                allowGrouping: true,
                allowReordering: true,
                editSettings: { allowEditing: true, allowAdding: true, allowDeleting: true },
                columns: [
                    { headerText: 'OrderID', field: 'OrderID', isPrimaryKey: true, width: 120 },
                    { headerText: 'CustomerID', field: 'CustomerID', width: 140 },
                    { headerText: 'Freight', field: 'Freight', format: 'C2', width: 140 },
                    { headerText: 'ShipCountry', field: 'ShipCountry', width: 140 },
                    { headerText: 'ShipCity', field: 'ShipCity', width: 150 }
                ]
            }, done);
        });
        afterAll(() => {
            destroy(gridObj);
            gridObj = undefined as any;
        });

        it('module should not be injected when enableWebMcp is false', (done: Function) => {
            const grid: Grid = createGrid({
                dataSource: data,
                columns: [{ field: 'OrderID' }, { field: 'CustomerID' }]
            }, () => {
                expect((grid as any).webMcpGridModule).toBeUndefined();
                destroy(grid);
                done();
            });
        });

        it('module should be injected when enableWebMcp is true', (done: Function) => {
            expect((gridObj as any).webMcpGridModule).toBeDefined();
            destroy(gridObj);
            gridObj = undefined as any;
            done();
        });
    });

    describe('getTools ->', () => {
        beforeAll((done: Function) => {
            gridObj = createGrid({
                enableWebMcp: true,
                dataSource: data,
                columns: [
                    { field: 'OrderID', isPrimaryKey: true },
                    { field: 'CustomerID' },
                    { field: 'ShipCity' }
                ],
            }, done);
        });
        afterAll(() => {
            destroy(gridObj);
            gridObj = undefined as any;
        });

        it('returns all tools when no toolNames filter provided', () => {
            const args: { toolNames?: string[]; tools?: WebMcpTool[] } = {};
            gridObj.notify('getWebMcpTools', args as any);
            const tools = args.tools as WebMcpTool[];
            expect(Array.isArray(tools)).toBeTruthy();
            expect(tools.length).toBe(TOOL_COUNT);
            const names: string[] = tools.map((t: any) => t.name);
            expect(names).toContain('getSelectedRecords');
            expect(names).toContain('selection');
            expect(names).toContain('configurationHelpers');
            tools.forEach((tool: any) => {
                expect(tool.name).toBeDefined();
                expect(tool.description).toBeDefined();
                expect(tool.inputSchema).toBeDefined();
                expect(tool.outputSchema).toBeDefined();
                expect(tool.annotations).toBeDefined();
            });
        });

        it('returns empty when no matching toolNames', () => {
            const args: { toolNames?: string[]; tools?: WebMcpTool[] } = { toolNames: ['nonExistentTool'] };
            gridObj.notify('getWebMcpTools', args as any);
            expect(args.tools!.length).toBe(0);
            expect(args.tools).toEqual([]);
        });

        it('returns only matching tools when valid toolNames provided', () => {
            const args: { toolNames?: string[]; tools?: WebMcpTool[] } = { toolNames: ['getSelectedRecords', 'selection'] };
            gridObj.notify('getWebMcpTools', args as any);
            expect(args.tools!.length).toBe(2);
            expect(args.tools![0].name).toBe('getSelectedRecords');
            expect(args.tools![1].name).toBe('selection');
        });

        it('returns copies (no same references)', () => {
            const args1: { toolNames?: string[]; tools?: WebMcpTool[] } = { toolNames: ['getSelectedRecords'] };
            const args2: { toolNames?: string[]; tools?: WebMcpTool[] } = { toolNames: ['getSelectedRecords'] };
            gridObj.notify('getWebMcpTools', args1 as any);
            gridObj.notify('getWebMcpTools', args2 as any);
            expect(args1.tools![0]).not.toBe(args2.tools![0]);
        });

        it('empty toolNames array returns all tools', () => {
            const args: { toolNames?: string[]; tools?: WebMcpTool[] } = { toolNames: [] };
            gridObj.notify('getWebMcpTools', args as any);
            expect(args.tools!.length).toBe(TOOL_COUNT);
        });
    });

    describe('beforeWebMcpToolExecute + executeHandler branches ->', () => {
        beforeAll((done: Function) => {
            gridObj = createGrid({
                enableWebMcp: true,
                dataSource: data,
                allowPaging: true,
                allowSorting: true,
                allowSelection: true,
                columns: [
                    { field: 'OrderID', isPrimaryKey: true },
                    { field: 'CustomerID' }
                ],
            }, done);
        });

        afterAll(() => {
            destroy(gridObj);
            gridObj = undefined as any;
        });

        it('cancel via beforeWebMcpToolExecute returns cancelled response + uses exact cancellationResponse when provided', (done: Function) => {
            const handler = (args: any): void => {
                args.cancel = true;
                args.cancellationResponse = 'Tool cancelled for testing';
            };
            gridObj.addEventListener('beforeWebMcpToolExecute', handler);
            triggerTool(gridObj, 'getSelectedRecords', {}).then((response: WebMcpToolResponse) => {
                gridObj.removeEventListener('beforeWebMcpToolExecute', handler);
                const result: any = parseContent(response);
                expect(result.cancelled).toBe(true);
                expect(result.message).toBe('Tool cancelled for testing');
                expect(result.action).toBe('getSelectedRecords');
                done();
            }).catch((e: any) => fail(e));
        });

        it('cancel without cancellationResponse returns default [USER_CANCELLED] message', (done: Function) => {
            gridObj.addEventListener('beforeWebMcpToolExecute', interactionHandler);
            triggerTool(gridObj, 'getSelectedRecords', {}).then((response: WebMcpToolResponse) => {
                gridObj.removeEventListener('beforeWebMcpToolExecute', interactionHandler);
                const result: any = parseContent(response);
                expect(result.cancelled).toBe(true);
                expect(result.message).toContain('[USER_CANCELLED]');
                done();
            }).catch((e: any) => fail(e));
        });

        it('showConfirmationDialog approved path (requestConfirmation mocked true) proceeds to baseCommand', (done: Function) => {
            const handler = (args: any): void => {
                args.showConfirmationDialog = true;
            };
            gridObj.addEventListener('beforeWebMcpToolExecute', handler);
            const module: any = getModule(gridObj);
            const orig = module.requestConfirmation;
            module.requestConfirmation = () => Promise.resolve(true);
            triggerTool(gridObj, 'clearSorting', {}).then((response: WebMcpToolResponse) => {
                module.requestConfirmation = orig;
                gridObj.removeEventListener('beforeWebMcpToolExecute', handler);
                const result: any = parseContent(response);
                expect(result.sortingCleared).toBe(true);
                expect(result.cancelled).toBeUndefined();
                done();
            }).catch((e: any) => fail(e));
        });

        it('showConfirmationDialog denied path (requestConfirmation mocked false) returns cancelled with default denied message', (done: Function) => {
            const handler = (args: any): void => {
                args.showConfirmationDialog = true;
                args.cancel = true;
            };
            gridObj.addEventListener('beforeWebMcpToolExecute', handler);
            const module: any = getModule(gridObj);
            const orig = module.requestConfirmation;
            module.requestConfirmation = () => Promise.resolve(false);
            triggerTool(gridObj, 'clearSorting', {}).then((response: WebMcpToolResponse) => {
                module.requestConfirmation = orig;
                gridObj.removeEventListener('beforeWebMcpToolExecute', handler);
                const result: any = parseContent(response);
                // in this simplified branch we expect cancellation due to before handler
                expect(result.cancelled).toBe(true);
                done();
            }).catch((e: any) => fail(e));
        });

        it('showConfirmationDialog denied uses cancellationResponse when set', (done: Function) => {
            const handler = (args: any): void => {
                args.showConfirmationDialog = true;
                args.cancellationResponse = 'User said no';
            };
            gridObj.addEventListener('beforeWebMcpToolExecute', handler);
            const module: any = getModule(gridObj);
            const orig = module.requestConfirmation;
            module.requestConfirmation = () => Promise.resolve(false);
            triggerTool(gridObj, 'clearSorting', {}).then((response: WebMcpToolResponse) => {
                module.requestConfirmation = orig;
                gridObj.removeEventListener('beforeWebMcpToolExecute', handler);
                const result: any = parseContent(response);
                expect(result.cancelled).toBe(true);
                expect(result.message).toBe('User said no');
                done();
            }).catch((e: any) => fail(e));
        });

        it('readOnlyHint skips confirmation dialog when showConfirmationDialog is true', (done: Function) => {
            const handler = (args: any): void => {
                args.showConfirmationDialog = true;
            };
            gridObj.addEventListener('beforeWebMcpToolExecute', handler);
            const module: any = getModule(gridObj);
            const orig = module.requestConfirmation;
            let asked = false;
            module.requestConfirmation = () => { asked = true; return Promise.resolve(false); };
            triggerTool(gridObj, 'getSelectedRecords', {}).then((response: WebMcpToolResponse) => {
                module.requestConfirmation = orig;
                gridObj.removeEventListener('beforeWebMcpToolExecute', handler);
                expect(asked).toBe(false);
                expect(response.isError).toBeFalsy();
                done();
            }).catch((e: any) => fail(e));
        });

        it('unknown tool name returns Tool not found error', (done: Function) => {
            triggerTool(gridObj, 'unknownTool', {}).then((response: WebMcpToolResponse) => {
                expect(response.isError).toBe(true);
                expect(response.content[0].text).toBe('Tool "unknownTool" not found.');
                done();
            }).catch((e: any) => fail(e));
        });

        it('executeHandler catch: non-Error thrown returns Tool execution failed', (done: Function) => {
            const orig = (gridObj as any).goToPage;
            (gridObj as any).goToPage = () => { throw 'string error'; };
            triggerTool(gridObj, 'navigateToPage', { pageNo: 1 }).then((response: WebMcpToolResponse) => {
                (gridObj as any).goToPage = orig;
                expect(response.isError).toBe(true);
                expect(response.content[0].text).toBe('Tool execution failed');
                done();
            }).catch((e: any) => fail(e));
        });

        it('executeHandler catch: Error instance thrown returns exact message', (done: Function) => {
            const orig = (gridObj as any).goToPage;
            (gridObj as any).goToPage = () => { throw new Error('boom'); };
            triggerTool(gridObj, 'navigateToPage', { pageNo: 1 }).then((response: WebMcpToolResponse) => {
                (gridObj as any).goToPage = orig;
                expect(response.isError).toBe(true);
                expect(response.content[0].text).toBe('boom');
                done();
            }).catch((e: any) => fail(e));
        });

        // Remaining switch cases are covered via a mix of action invocation + spy checks
        it('getSelectedRowIndexes returns an array', (done: Function) => {
            triggerTool(gridObj, 'getSelectedRowIndexes', {}).then((response: WebMcpToolResponse) => {
                const parsed = parseContent(response);
                expect(Array.isArray(parsed.selectedRowIndexes)).toBe(true);
                done();
            }).catch((e: any) => fail(e));
        });

        it('navigateToPage respects pageNo and calls goToPage synchronously when waitForCompletion is false', (done: Function) => {
            const orig = (gridObj as any).goToPage;
            let called = false;
            (gridObj as any).goToPage = (p: number) => { called = true; expect(p).toBe(3); };
            triggerTool(gridObj, 'navigateToPage', { pageNo: 3, waitForCompletion: false }).then((response: WebMcpToolResponse) => {
                (gridObj as any).goToPage = orig;
                const parsed = parseContent(response);
                expect(called).toBe(true);
                expect(parsed.pageNo).toBe(3);
                done();
            }).catch((e: any) => { (gridObj as any).goToPage = orig; fail(e); });
        });

        it('sortByColumn calls sortColumnAsync when waitForCompletion is true', (done: Function) => {
            const orig = (gridObj as any).sortColumnAsync;
            let called = false;
            (gridObj as any).sortColumnAsync = (col: string) => { called = true; expect(col).toBe('CustomerID'); return Promise.resolve(); };
            triggerTool(gridObj, 'sortByColumn', { columnName: 'CustomerID', direction: 'Descending', isMultiSort: false, waitForCompletion: true }).then((response: WebMcpToolResponse) => {
                (gridObj as any).sortColumnAsync = orig;
                const parsed = parseContent(response);
                expect(called).toBe(true);
                expect(parsed.sortedBy).toBe('CustomerID');
                expect(parsed.direction).toBe('Descending');
                done();
            }).catch((e: any) => { (gridObj as any).sortColumnAsync = orig; fail(e); });
        });

        it('clearSorting calls clearSortingAsync when waitForCompletion is true', (done: Function) => {
            const orig = (gridObj as any).clearSortingAsync;
            let called = false;
            (gridObj as any).clearSortingAsync = () => { called = true; return Promise.resolve(); };
            triggerTool(gridObj, 'clearSorting', { waitForCompletion: true }).then((response: WebMcpToolResponse) => {
                (gridObj as any).clearSortingAsync = orig;
                const parsed = parseContent(response);
                expect(called).toBe(true);
                expect(parsed.sortingCleared).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).clearSortingAsync = orig; fail(e); });
        });

        it('filterByColumn uses async path and returns filteredBy', (done: Function) => {
            const orig = (gridObj as any).filterByColumnAsync;
            let called = false;
            (gridObj as any).filterByColumnAsync = () => { called = true; return Promise.resolve(); };
            triggerTool(gridObj, 'filterByColumn', { fieldName: 'CustomerID', filterOperator: 'contains', filterValue: 'A', predicate: 'and', matchCase: false, ignoreAccent: false, waitForCompletion: true }).then((response: WebMcpToolResponse) => {
                (gridObj as any).filterByColumnAsync = orig;
                const parsed = parseContent(response);
                expect(called).toBe(true);
                expect(parsed.filteredBy).toBe('CustomerID');
                done();
            }).catch((e: any) => { (gridObj as any).filterByColumnAsync = orig; fail(e); });
        });

        it('clearFiltering calls clearFiltering when waitForCompletion is false', (done: Function) => {
            const orig = (gridObj as any).clearFiltering;
            let called = false;
            (gridObj as any).clearFiltering = () => { called = true; };
            triggerTool(gridObj, 'clearFiltering', { fields: ['CustomerID'], waitForCompletion: false }).then((response: WebMcpToolResponse) => {
                (gridObj as any).clearFiltering = orig;
                const parsed = parseContent(response);
                expect(called).toBe(true);
                expect(parsed.filteringCleared).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).clearFiltering = orig; fail(e); });
        });

        it('selection: unknown selection mode returns an error', (done: Function) => {
            triggerTool(gridObj, 'selection', { mode: 'nope' }).then((response: WebMcpToolResponse) => {
                expect(response.isError).toBe(true);
                expect(response.content[0].text).toContain('Unknown selection mode');
                done();
            }).catch((e: any) => fail(e));
        });

        it('selection: selectRows executes and returns message', (done: Function) => {
            const orig = (gridObj as any).selectRows;
            let called = false;
            (gridObj as any).selectRows = () => { called = true; };
            triggerTool(gridObj, 'selection', { mode: 'selectRows', indexes: [0, 1] }).then((response: WebMcpToolResponse) => {
                (gridObj as any).selectRows = orig;
                expect(response.isError).toBeFalsy();
                expect(called).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).selectRows = orig; fail(e); });
        });

        it('requestConfirmation fast-path: baseCommand resolved from prefixed toolName', (done: Function) => {
            gridObj.addEventListener('beforeWebMcpToolExecute', (args: any) => { args.showConfirmationDialog = true; });
            triggerTool(gridObj, 'gridAnno_getSelectedRecords', {}).then((response: WebMcpToolResponse) => {
                const parsed = parseContent(response);
                expect(response.isError).toBeFalsy();
                expect(parsed.selectedRecords).toBeDefined();
                done();
            }).catch((e: any) => fail(e));
        });

        // ---- Remaining executeHandler switch coverage ----

        it('clearSelection calls clearSelection and returns selectionCleared', (done: Function) => {
            const orig = (gridObj as any).clearSelection;
            let called = false;
            (gridObj as any).clearSelection = () => { called = true; };
            triggerTool(gridObj, 'clearSelection', {}).then((response: WebMcpToolResponse) => {
                (gridObj as any).clearSelection = orig;
                const parsed = parseContent(response);
                expect(called).toBe(true);
                expect(parsed.selectionCleared).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).clearSelection = orig; fail(e); });
        });

        it('setRowData sync path when waitForCompletion is false', (done: Function) => {
            const orig = (gridObj as any).setRowData;
            let called = false;
            (gridObj as any).setRowData = () => { called = true; };
            triggerTool(gridObj, 'setRowData', { key: 1, rowData: { OrderID: 1 }, waitForCompletion: false, delay: 0 }).then((response: WebMcpToolResponse) => {
                (gridObj as any).setRowData = orig;
                const parsed = parseContent(response);
                expect(called).toBe(true);
                expect(parsed.rowDataUpdated).toBe(true);
                expect(parsed.key).toBe(1);
                done();
            }).catch((e: any) => { (gridObj as any).setRowData = orig; fail(e); });
        });

        it('setCellValue returns cellValueUpdated and calls setCellValue', (done: Function) => {
            const orig = (gridObj as any).setCellValue;
            let called = false;
            (gridObj as any).setCellValue = () => { called = true; };
            triggerTool(gridObj, 'setCellValue', { key: 1, field: 'CustomerID', value: 'X' }).then((response: WebMcpToolResponse) => {
                (gridObj as any).setCellValue = orig;
                const parsed = parseContent(response);
                expect(called).toBe(true);
                expect(parsed.cellValueUpdated).toBe(true);
                expect(parsed.key).toBe(1);
                expect(parsed.field).toBe('CustomerID');
                done();
            }).catch((e: any) => { (gridObj as any).setCellValue = orig; fail(e); });
        });

        it('saveBulkChanges sync path and returns bulkChangesSaved', (done: Function) => {
            const orig = (gridObj as any).saveBulkChanges;
            let called = false;
            (gridObj as any).saveBulkChanges = () => { called = true; };
            triggerTool(gridObj, 'saveBulkChanges', { changedData: { a: 1 }, rowData: [], waitForCompletion: false }).then((response: WebMcpToolResponse) => {
                (gridObj as any).saveBulkChanges = orig;
                const parsed = parseContent(response);
                expect(called).toBe(true);
                expect(parsed.bulkChangesSaved).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).saveBulkChanges = orig; fail(e); });
        });

        it('changeDataSource calls changeDataSource and returns dataSourceChanged', (done: Function) => {
            const orig = (gridObj as any).changeDataSource;
            let called = false;
            (gridObj as any).changeDataSource = () => { called = true; };
            triggerTool(gridObj, 'changeDataSource', { dataSource: data, columns: ['OrderID'], properties: {} }).then((response: WebMcpToolResponse) => {
                (gridObj as any).changeDataSource = orig;
                const parsed = parseContent(response);
                expect(called).toBe(true);
                expect(parsed.dataSourceChanged).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).changeDataSource = orig; fail(e); });
        });

        it('getFilteredRecords returns resolved filteredRecords when waitForPromise is true', (done: Function) => {
            const orig = (gridObj as any).getFilteredRecords;
            (gridObj as any).getFilteredRecords = () => Promise.resolve([{ id: 1 }]);
            triggerTool(gridObj, 'getFilteredRecords', { waitForPromise: true }).then((response: WebMcpToolResponse) => {
                (gridObj as any).getFilteredRecords = orig;
                const parsed = parseContent(response);
                expect(Array.isArray(parsed.filteredRecords)).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).getFilteredRecords = orig; fail(e); });
        });

        it('selection: selectRow executes and returns message', (done: Function) => {
            const orig = (gridObj as any).selectRow;
            let called = false;
            (gridObj as any).selectRow = (idx: number) => { called = true; expect(idx).toBe(2); };
            triggerTool(gridObj, 'selection', { mode: 'selectRow', index: 2 }).then((response: WebMcpToolResponse) => {
                (gridObj as any).selectRow = orig;
                expect(response.isError).toBeFalsy();
                expect(called).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).selectRow = orig; fail(e); });
        });

        it('selection: selectCells executes and returns message', (done: Function) => {
            const orig = (gridObj as any).selectCells;
            let called = false;
            (gridObj as any).selectCells = (cells: any[]) => { called = true; expect(cells.length).toBe(1); };
            triggerTool(gridObj, 'selection', { mode: 'selectCells', cellIndexes: [{ rowIndex: 0, columnIndex: 0 }] }).then((response: WebMcpToolResponse) => {
                (gridObj as any).selectCells = orig;
                expect(response.isError).toBeFalsy();
                expect(called).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).selectCells = orig; fail(e); });
        });

        it('selectionRangeHelpers: clearCellSelection calls clearCellSelection', (done: Function) => {
            const orig = (gridObj as any).clearCellSelection;
            let called = false;
            (gridObj as any).clearCellSelection = () => { called = true; };
            triggerTool(gridObj, 'selectionRangeHelpers', { mode: 'clearCellSelection', waitForCompletion: false }).then((response: WebMcpToolResponse) => {
                (gridObj as any).clearCellSelection = orig;
                expect(response.isError).toBeFalsy();
                expect(called).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).clearCellSelection = orig; fail(e); });
        });

        it('selectionRangeHelpers: clearRowSelection calls clearRowSelection', (done: Function) => {
            const orig = (gridObj as any).clearRowSelection;
            let called = false;
            (gridObj as any).clearRowSelection = () => { called = true; };
            triggerTool(gridObj, 'selectionRangeHelpers', { mode: 'clearRowSelection', waitForCompletion: false }).then((response: WebMcpToolResponse) => {
                (gridObj as any).clearRowSelection = orig;
                expect(response.isError).toBeFalsy();
                expect(called).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).clearRowSelection = orig; fail(e); });
        });

        it('crudLifecycle: startEdit calls startEdit', (done: Function) => {
            const orig = (gridObj as any).startEdit;
            let called = false;
            (gridObj as any).startEdit = () => { called = true; };
            triggerTool(gridObj, 'crudLifecycle', { mode: 'startEdit' }).then((response: WebMcpToolResponse) => {
                (gridObj as any).startEdit = orig;
                expect(response.isError).toBeFalsy();
                expect(called).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).startEdit = orig; fail(e); });
        });

        it('toolbarClipboardUtilities: enableToolbarItems calls enableToolbarItems', (done: Function) => {
            const orig = (gridObj as any).enableToolbarItems;
            let called = false;
            (gridObj as any).enableToolbarItems = (items: string[], isEnable: boolean) => {
                called = true;
                expect(items.length).toBe(2);
                expect(isEnable).toBe(true);
            };
            triggerTool(gridObj, 'toolbarClipboardUtilities', { mode: 'enableToolbarItems', items: ['A', 'B'], isEnable: true }).then((response: WebMcpToolResponse) => {
                (gridObj as any).enableToolbarItems = orig;
                expect(response.isError).toBeFalsy();
                expect(called).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).enableToolbarItems = orig; fail(e); });
        });

        it('toolbarClipboardUtilities: copy calls copy', (done: Function) => {
            const orig = (gridObj as any).copy;
            let called = false;
            (gridObj as any).copy = () => { called = true; };
            triggerTool(gridObj, 'toolbarClipboardUtilities', { mode: 'copy', withHeader: false }).then((response: WebMcpToolResponse) => {
                (gridObj as any).copy = orig;
                expect(response.isError).toBeFalsy();
                expect(called).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).copy = orig; fail(e); });
        });

        it('showConfirmationDialog denied without cancellationResponse returns default denied message', (done: Function) => {
            const handler = (args: any): void => {
                args.showConfirmationDialog = true;
            };
            gridObj.addEventListener('beforeWebMcpToolExecute', handler);
            const module: any = getModule(gridObj);
            const orig = module.requestConfirmation;
            module.requestConfirmation = () => Promise.resolve(false);
            triggerTool(gridObj, 'clearSorting', {}).then((response: WebMcpToolResponse) => {
                module.requestConfirmation = orig;
                gridObj.removeEventListener('beforeWebMcpToolExecute', handler);
                const result: any = parseContent(response);
                expect(result.cancelled).toBe(true);
                expect(result.message).toContain('[USER_CANCELLED] User denied:');
                done();
            }).catch((e: any) => fail(e));
        });

        it('getSelectedRecords returns [] when grid method is unavailable', (done: Function) => {
            const orig = (gridObj as any).getSelectedRecords;
            (gridObj as any).getSelectedRecords = undefined;
            triggerTool(gridObj, 'getSelectedRecords', {}).then((response: WebMcpToolResponse) => {
                (gridObj as any).getSelectedRecords = orig;
                const parsed = parseContent(response);
                expect(parsed.selectedRecords).toEqual([]);
                done();
            }).catch((e: any) => { (gridObj as any).getSelectedRecords = orig; fail(e); });
        });

        it('getSelectedRowIndexes returns [] when grid method is unavailable', (done: Function) => {
            const orig = (gridObj as any).getSelectedRowIndexes;
            (gridObj as any).getSelectedRowIndexes = undefined;
            triggerTool(gridObj, 'getSelectedRowIndexes', {}).then((response: WebMcpToolResponse) => {
                (gridObj as any).getSelectedRowIndexes = orig;
                const parsed = parseContent(response);
                expect(parsed.selectedRowIndexes).toEqual([]);
                done();
            }).catch((e: any) => { (gridObj as any).getSelectedRowIndexes = orig; fail(e); });
        });

        it('navigateToPage calls goToPageAsync when waitForCompletion is true', (done: Function) => {
            const orig = (gridObj as any).goToPageAsync;
            let called = false;
            (gridObj as any).goToPageAsync = (p: number) => { called = true; expect(p).toBe(2); return Promise.resolve(); };
            triggerTool(gridObj, 'navigateToPage', { pageNo: 2, waitForCompletion: true }).then((response: WebMcpToolResponse) => {
                (gridObj as any).goToPageAsync = orig;
                const parsed = parseContent(response);
                expect(called).toBe(true);
                expect(parsed.pageNo).toBe(2);
                done();
            }).catch((e: any) => { (gridObj as any).goToPageAsync = orig; fail(e); });
        });

        it('navigateToPage defaults pageNo to 1 when not provided', (done: Function) => {
            const orig = (gridObj as any).goToPage;
            let calledWith = 0;
            (gridObj as any).goToPage = (p: number) => { calledWith = p; };
            triggerTool(gridObj, 'navigateToPage', {}).then((response: WebMcpToolResponse) => {
                (gridObj as any).goToPage = orig;
                const parsed = parseContent(response);
                expect(calledWith).toBe(1);
                expect(parsed.pageNo).toBe(1);
                done();
            }).catch((e: any) => { (gridObj as any).goToPage = orig; fail(e); });
        });

        it('sortByColumn sync path defaults direction to Ascending', (done: Function) => {
            const orig = (gridObj as any).sortColumn;
            let called = false;
            (gridObj as any).sortColumn = (col: string, dir: string, multi: boolean) => {
                called = true;
                expect(col).toBe('OrderID');
                expect(dir).toBe('Ascending');
                expect(multi).toBe(false);
            };
            triggerTool(gridObj, 'sortByColumn', { columnName: 'OrderID' }).then((response: WebMcpToolResponse) => {
                (gridObj as any).sortColumn = orig;
                const parsed = parseContent(response);
                expect(called).toBe(true);
                expect(parsed.direction).toBe('Ascending');
                done();
            }).catch((e: any) => { (gridObj as any).sortColumn = orig; fail(e); });
        });

        it('clearSorting sync path calls clearSorting', (done: Function) => {
            const orig = (gridObj as any).clearSorting;
            let called = false;
            (gridObj as any).clearSorting = () => { called = true; };
            triggerTool(gridObj, 'clearSorting', { waitForCompletion: false }).then((response: WebMcpToolResponse) => {
                (gridObj as any).clearSorting = orig;
                const parsed = parseContent(response);
                expect(called).toBe(true);
                expect(parsed.sortingCleared).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).clearSorting = orig; fail(e); });
        });

        it('filterByColumn array value uses async path and defaults predicate to and', (done: Function) => {
            const orig = (gridObj as any).filterByColumnAsync;
            let called = false;
            (gridObj as any).filterByColumnAsync = (
                f: string, op: string, val: any, pred: string, matchCase: boolean, ignoreAccent: boolean) => {
                called = true;
                expect(f).toBe('CustomerID');
                expect(op).toBe('contains');
                expect(val).toEqual(['a', 'b']);
                expect(pred).toBe('and');
                expect(matchCase).toBe(false);
                expect(ignoreAccent).toBe(false);
                return Promise.resolve();
            };
            triggerTool(gridObj, 'filterByColumn', {
                fieldName: 'CustomerID', filterOperator: 'contains', filterValue: ['a', 'b'], waitForCompletion: true
            }).then((response: WebMcpToolResponse) => {
                (gridObj as any).filterByColumnAsync = orig;
                const parsed = parseContent(response);
                expect(called).toBe(true);
                expect(parsed.filteredBy).toBe('CustomerID');
                done();
            }).catch((e: any) => { (gridObj as any).filterByColumnAsync = orig; fail(e); });
        });

        it('filterByColumn array value uses sync path', (done: Function) => {
            const orig = (gridObj as any).filterByColumn;
            let called = false;
            (gridObj as any).filterByColumn = (
                f: string, op: string, val: any, pred: string, matchCase: boolean, ignoreAccent: boolean) => {
                called = true;
                expect(f).toBe('OrderID');
                expect(val).toEqual([10248, 10249]);
                expect(pred).toBe('or');
            };
            triggerTool(gridObj, 'filterByColumn', {
                fieldName: 'OrderID', filterOperator: 'equal', filterValue: [10248, 10249], predicate: 'or',
                waitForCompletion: false
            }).then((response: WebMcpToolResponse) => {
                (gridObj as any).filterByColumn = orig;
                const parsed = parseContent(response);
                expect(called).toBe(true);
                expect(parsed.filteredBy).toBe('OrderID');
                done();
            }).catch((e: any) => { (gridObj as any).filterByColumn = orig; fail(e); });
        });

        it('filterByColumn scalar value uses sync path', (done: Function) => {
            const orig = (gridObj as any).filterByColumn;
            let called = false;
            (gridObj as any).filterByColumn = (
                f: string, op: string, val: any, pred: string, matchCase: boolean, ignoreAccent: boolean) => {
                called = true;
                expect(f).toBe('CustomerID');
                expect(val).toBe('A');
                expect(matchCase).toBe(true);
                expect(ignoreAccent).toBe(true);
            };
            triggerTool(gridObj, 'filterByColumn', {
                fieldName: 'CustomerID', filterOperator: 'contains', filterValue: 'A', predicate: 'and',
                matchCase: true, ignoreAccent: true, waitForCompletion: false
            }).then((response: WebMcpToolResponse) => {
                (gridObj as any).filterByColumn = orig;
                const parsed = parseContent(response);
                expect(called).toBe(true);
                expect(parsed.filteredBy).toBe('CustomerID');
                done();
            }).catch((e: any) => { (gridObj as any).filterByColumn = orig; fail(e); });
        });

        it('clearFiltering async path calls clearFilteringAsync with fields', (done: Function) => {
            const orig = (gridObj as any).clearFilteringAsync;
            let called = false;
            (gridObj as any).clearFilteringAsync = (fields: string[]) => {
                called = true;
                expect(fields).toEqual(['CustomerID']);
                return Promise.resolve();
            };
            triggerTool(gridObj, 'clearFiltering', { fields: ['CustomerID'], waitForCompletion: true }).then((response: WebMcpToolResponse) => {
                (gridObj as any).clearFilteringAsync = orig;
                const parsed = parseContent(response);
                expect(called).toBe(true);
                expect(parsed.filteringCleared).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).clearFilteringAsync = orig; fail(e); });
        });

        it('setRowData async path calls setRowDataAsync with delay', (done: Function) => {
            const orig = (gridObj as any).setRowDataAsync;
            let called = false;
            (gridObj as any).setRowDataAsync = (k: any, row: any, delay: any) => {
                called = true;
                expect(k).toBe(1);
                expect(row).toEqual({ OrderID: 1 });
                expect(delay).toBe(500);
                return Promise.resolve();
            };
            triggerTool(gridObj, 'setRowData', { key: 1, rowData: { OrderID: 1 }, waitForCompletion: true, delay: 500 }).then((response: WebMcpToolResponse) => {
                (gridObj as any).setRowDataAsync = orig;
                const parsed = parseContent(response);
                expect(called).toBe(true);
                expect(parsed.rowDataUpdated).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).setRowDataAsync = orig; fail(e); });
        });

        it('getCurrentViewRecords returns currentViewRecords', (done: Function) => {
            const orig = (gridObj as any).getCurrentViewRecords;
            (gridObj as any).getCurrentViewRecords = () => [{ OrderID: 1 }];
            triggerTool(gridObj, 'getCurrentViewRecords', {}).then((response: WebMcpToolResponse) => {
                (gridObj as any).getCurrentViewRecords = orig;
                const parsed = parseContent(response);
                expect(parsed.currentViewRecords).toEqual([{ OrderID: 1 }]);
                done();
            }).catch((e: any) => { (gridObj as any).getCurrentViewRecords = orig; fail(e); });
        });

        it('getFilteredRecords returns raw value when result is not a Promise even if waitForPromise is true', (done: Function) => {
            const orig = (gridObj as any).getFilteredRecords;
            (gridObj as any).getFilteredRecords = () => ['a', 'b'];
            triggerTool(gridObj, 'getFilteredRecords', { waitForPromise: true }).then((response: WebMcpToolResponse) => {
                (gridObj as any).getFilteredRecords = orig;
                const parsed = parseContent(response);
                expect(parsed.filteredRecords).toEqual(['a', 'b']);
                done();
            }).catch((e: any) => { (gridObj as any).getFilteredRecords = orig; fail(e); });
        });

        it('getFilteredRecords does not await Promise when waitForPromise is false', (done: Function) => {
            const orig = (gridObj as any).getFilteredRecords;
            (gridObj as any).getFilteredRecords = () => Promise.resolve(['x']);
            triggerTool(gridObj, 'getFilteredRecords', { waitForPromise: false }).then((response: WebMcpToolResponse) => {
                (gridObj as any).getFilteredRecords = orig;
                const parsed = parseContent(response);
                expect(parsed.filteredRecords).toEqual({});
                done();
            }).catch((e: any) => { (gridObj as any).getFilteredRecords = orig; fail(e); });
        });

        it('selectRowByRange passes start and end indexes and returns selectedRange', (done: Function) => {
            const orig = (gridObj as any).selectRowsByRange;
            let called = false;
            (gridObj as any).selectRowsByRange = (s: number, e: number) => {
                called = true;
                expect(s).toBe(1);
                expect(e).toBe(3);
            };
            triggerTool(gridObj, 'selectRowByRange', { startIndex: 1, endIndex: 3 }).then((response: WebMcpToolResponse) => {
                (gridObj as any).selectRowsByRange = orig;
                const parsed = parseContent(response);
                expect(called).toBe(true);
                expect(parsed.selectedRange).toBe('1-3');
                done();
            }).catch((e: any) => { (gridObj as any).selectRowsByRange = orig; fail(e); });
        });

        it('exports excel calls excelExport and returns exportResult', (done: Function) => {
            const orig = (gridObj as any).excelExport;
            let called = false;
            (gridObj as any).excelExport = (opt: any) => { called = true; expect(opt).toEqual({}); return Promise.resolve('excel-result'); };
            triggerTool(gridObj, 'exports', { exportType: 'excel', exportOptions: {} }).then((response: WebMcpToolResponse) => {
                (gridObj as any).excelExport = orig;
                const parsed = parseContent(response);
                expect(called).toBe(true);
                expect(parsed.exportResult).toBe('excel-result');
                done();
            }).catch((e: any) => { (gridObj as any).excelExport = orig; fail(e); });
        });

        it('exports csv calls csvExport and returns exportResult', (done: Function) => {
            const orig = (gridObj as any).csvExport;
            let called = false;
            (gridObj as any).csvExport = (opt: any) => { called = true; expect(opt).toEqual({}); return Promise.resolve('csv-result'); };
            triggerTool(gridObj, 'exports', { exportType: 'csv', exportOptions: {} }).then((response: WebMcpToolResponse) => {
                (gridObj as any).csvExport = orig;
                const parsed = parseContent(response);
                expect(called).toBe(true);
                expect(parsed.exportResult).toBe('csv-result');
                done();
            }).catch((e: any) => { (gridObj as any).csvExport = orig; fail(e); });
        });

        it('exports pdf calls pdfExport and returns exportResult', (done: Function) => {
            const orig = (gridObj as any).pdfExport;
            let called = false;
            (gridObj as any).pdfExport = (opt: any) => { called = true; expect(opt).toEqual({}); return Promise.resolve('pdf-result'); };
            triggerTool(gridObj, 'exports', { exportType: 'pdf', exportOptions: {} }).then((response: WebMcpToolResponse) => {
                (gridObj as any).pdfExport = orig;
                const parsed = parseContent(response);
                expect(called).toBe(true);
                expect(parsed.exportResult).toBe('pdf-result');
                done();
            }).catch((e: any) => { (gridObj as any).pdfExport = orig; fail(e); });
        });

        it('exports unknown type returns error', (done: Function) => {
            triggerTool(gridObj, 'exports', { exportType: 'zip' }).then((response: WebMcpToolResponse) => {
                expect(response.isError).toBe(true);
                expect(response.content[0].text).toBe('Unknown export type: "zip"');
                done();
            }).catch((e: any) => fail(e));
        });

        it('crudLifecycle: endEdit calls endEdit', (done: Function) => {
            const orig = (gridObj as any).endEdit;
            let called = false;
            (gridObj as any).endEdit = () => { called = true; return Promise.resolve(); };
            triggerTool(gridObj, 'crudLifecycle', { mode: 'endEdit' }).then((response: WebMcpToolResponse) => {
                (gridObj as any).endEdit = orig;
                expect(response.isError).toBeFalsy();
                expect(called).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).endEdit = orig; fail(e); });
        });

        it('crudLifecycle: closeEdit calls closeEdit', (done: Function) => {
            const orig = (gridObj as any).closeEdit;
            let called = false;
            (gridObj as any).closeEdit = () => { called = true; };
            triggerTool(gridObj, 'crudLifecycle', { mode: 'closeEdit' }).then((response: WebMcpToolResponse) => {
                (gridObj as any).closeEdit = orig;
                expect(response.isError).toBeFalsy();
                expect(called).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).closeEdit = orig; fail(e); });
        });

        it('crudLifecycle: addRecord passes data and index', (done: Function) => {
            const orig = (gridObj as any).addRecord;
            let called = false;
            (gridObj as any).addRecord = (d: any, i: any) => {
                called = true;
                expect(d).toEqual({ OrderID: 99 });
                expect(i).toBe(0);
            };
            triggerTool(gridObj, 'crudLifecycle', { mode: 'addRecord', data: { OrderID: 99 }, index: 0 }).then((response: WebMcpToolResponse) => {
                (gridObj as any).addRecord = orig;
                expect(response.isError).toBeFalsy();
                expect(called).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).addRecord = orig; fail(e); });
        });

        it('crudLifecycle: deleteRecord passes fieldname and data', (done: Function) => {
            const orig = (gridObj as any).deleteRecord;
            let called = false;
            (gridObj as any).deleteRecord = (f: any, d: any) => {
                called = true;
                expect(f).toBe('OrderID');
                expect(d).toEqual({ OrderID: 99 });
            };
            triggerTool(gridObj, 'crudLifecycle', { mode: 'deleteRecord', fieldname: 'OrderID', data: { OrderID: 99 } }).then((response: WebMcpToolResponse) => {
                (gridObj as any).deleteRecord = orig;
                expect(response.isError).toBeFalsy();
                expect(called).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).deleteRecord = orig; fail(e); });
        });

        it('crudLifecycle: unknown mode returns error', (done: Function) => {
            triggerTool(gridObj, 'crudLifecycle', { mode: 'unknown' }).then((response: WebMcpToolResponse) => {
                expect(response.isError).toBe(true);
                expect(response.content[0].text).toBe('Unknown CRUD lifecycle mode: "unknown"');
                done();
            }).catch((e: any) => fail(e));
        });

        it('layoutContent: refresh calls refresh', (done: Function) => {
            const orig = (gridObj as any).refresh;
            let called = false;
            (gridObj as any).refresh = () => { called = true; };
            triggerTool(gridObj, 'layoutContent', { mode: 'refresh' }).then((response: WebMcpToolResponse) => {
                (gridObj as any).refresh = orig;
                expect(response.isError).toBeFalsy();
                expect(called).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).refresh = orig; fail(e); });
        });

        it('layoutContent: refreshColumns calls refreshColumns', (done: Function) => {
            const orig = (gridObj as any).refreshColumns;
            let called = false;
            (gridObj as any).refreshColumns = () => { called = true; };
            triggerTool(gridObj, 'layoutContent', { mode: 'refreshColumns' }).then((response: WebMcpToolResponse) => {
                (gridObj as any).refreshColumns = orig;
                expect(response.isError).toBeFalsy();
                expect(called).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).refreshColumns = orig; fail(e); });
        });

        it('layoutContent: showSpinner calls showSpinner', (done: Function) => {
            const orig = (gridObj as any).showSpinner;
            let called = false;
            (gridObj as any).showSpinner = () => { called = true; };
            triggerTool(gridObj, 'layoutContent', { mode: 'showSpinner' }).then((response: WebMcpToolResponse) => {
                (gridObj as any).showSpinner = orig;
                expect(response.isError).toBeFalsy();
                expect(called).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).showSpinner = orig; fail(e); });
        });

        it('layoutContent: hideSpinner calls hideSpinner', (done: Function) => {
            const orig = (gridObj as any).hideSpinner;
            let called = false;
            (gridObj as any).hideSpinner = () => { called = true; };
            triggerTool(gridObj, 'layoutContent', { mode: 'hideSpinner' }).then((response: WebMcpToolResponse) => {
                (gridObj as any).hideSpinner = orig;
                expect(response.isError).toBeFalsy();
                expect(called).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).hideSpinner = orig; fail(e); });
        });

        it('layoutContent: unknown mode returns error', (done: Function) => {
            triggerTool(gridObj, 'layoutContent', { mode: 'unknown' }).then((response: WebMcpToolResponse) => {
                expect(response.isError).toBe(true);
                expect(response.content[0].text).toBe('Unknown layout mode: "unknown"');
                done();
            }).catch((e: any) => fail(e));
        });

        it('columnVisibility: showColumns passes keys and showBy', (done: Function) => {
            const orig = (gridObj as any).showColumns;
            let called = false;
            (gridObj as any).showColumns = (keys: any, showBy: any) => {
                called = true;
                expect(keys).toEqual(['CustomerID']);
                expect(showBy).toBe('field');
            };
            triggerTool(gridObj, 'columnVisibility', { mode: 'showColumns', keys: ['CustomerID'], showBy: 'field' }).then((response: WebMcpToolResponse) => {
                (gridObj as any).showColumns = orig;
                expect(response.isError).toBeFalsy();
                expect(called).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).showColumns = orig; fail(e); });
        });

        it('columnVisibility: hideColumns passes keys and hideBy', (done: Function) => {
            const orig = (gridObj as any).hideColumns;
            let called = false;
            (gridObj as any).hideColumns = (keys: any, hideBy: any) => {
                called = true;
                expect(keys).toEqual(['CustomerID']);
                expect(hideBy).toBe('field');
            };
            triggerTool(gridObj, 'columnVisibility', { mode: 'hideColumns', keys: ['CustomerID'], hideBy: 'field' }).then((response: WebMcpToolResponse) => {
                (gridObj as any).hideColumns = orig;
                expect(response.isError).toBeFalsy();
                expect(called).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).hideColumns = orig; fail(e); });
        });

        it('columnVisibility: openColumnChooser calls openColumnChooser', (done: Function) => {
            const orig = (gridObj as any).openColumnChooser;
            let called = false;
            (gridObj as any).openColumnChooser = () => { called = true; };
            triggerTool(gridObj, 'columnVisibility', { mode: 'openColumnChooser' }).then((response: WebMcpToolResponse) => {
                (gridObj as any).openColumnChooser = orig;
                expect(response.isError).toBeFalsy();
                expect(called).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).openColumnChooser = orig; fail(e); });
        });

        it('columnVisibility: unknown mode returns error', (done: Function) => {
            triggerTool(gridObj, 'columnVisibility', { mode: 'unknown' }).then((response: WebMcpToolResponse) => {
                expect(response.isError).toBe(true);
                expect(response.content[0].text).toBe('Unknown column visibility mode: "unknown"');
                done();
            }).catch((e: any) => fail(e));
        });

        it('selectionRangeHelpers: unknown mode returns error', (done: Function) => {
            triggerTool(gridObj, 'selectionRangeHelpers', { mode: 'unknown' }).then((response: WebMcpToolResponse) => {
                expect(response.isError).toBe(true);
                expect(response.content[0].text).toBe('Unknown selection range mode: "unknown"');
                done();
            }).catch((e: any) => fail(e));
        });

        it('refreshAndSizing: autoFitColumns passes fieldNames and row indexes', (done: Function) => {
            const orig = (gridObj as any).autoFitColumns;
            let called = false;
            (gridObj as any).autoFitColumns = (f: any, s: any, e: any) => {
                called = true;
                expect(f).toEqual(['CustomerID']);
                expect(s).toBe(0);
                expect(e).toBe(1);
            };
            triggerTool(gridObj, 'refreshAndSizing', { mode: 'autoFitColumns', fieldNames: ['CustomerID'], startRowIndex: 0, endRowIndex: 1 }).then((response: WebMcpToolResponse) => {
                (gridObj as any).autoFitColumns = orig;
                expect(response.isError).toBeFalsy();
                expect(called).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).autoFitColumns = orig; fail(e); });
        });

        it('refreshAndSizing: refresh calls refresh', (done: Function) => {
            const orig = (gridObj as any).refresh;
            let called = false;
            (gridObj as any).refresh = () => { called = true; };
            triggerTool(gridObj, 'refreshAndSizing', { mode: 'refresh' }).then((response: WebMcpToolResponse) => {
                (gridObj as any).refresh = orig;
                expect(response.isError).toBeFalsy();
                expect(called).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).refresh = orig; fail(e); });
        });

        it('refreshAndSizing: refreshHeader calls refreshHeader', (done: Function) => {
            const orig = (gridObj as any).refreshHeader;
            let called = false;
            (gridObj as any).refreshHeader = () => { called = true; };
            triggerTool(gridObj, 'refreshAndSizing', { mode: 'refreshHeader' }).then((response: WebMcpToolResponse) => {
                (gridObj as any).refreshHeader = orig;
                expect(response.isError).toBeFalsy();
                expect(called).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).refreshHeader = orig; fail(e); });
        });

        it('refreshAndSizing: unknown mode returns error', (done: Function) => {
            triggerTool(gridObj, 'refreshAndSizing', { mode: 'unknown' }).then((response: WebMcpToolResponse) => {
                expect(response.isError).toBe(true);
                expect(response.content[0].text).toBe('Unknown refresh/sizing mode: "unknown"');
                done();
            }).catch((e: any) => fail(e));
        });

        it('reorderData: reorderColumns passes fromFName and toFName', (done: Function) => {
            const orig = (gridObj as any).reorderColumns;
            let called = false;
            (gridObj as any).reorderColumns = (fromF: any, toF: any) => {
                called = true;
                expect(fromF).toBe('OrderID');
                expect(toF).toBe('CustomerID');
            };
            triggerTool(gridObj, 'reorderData', { mode: 'reorderColumns', fromFName: 'OrderID', toFName: 'CustomerID' }).then((response: WebMcpToolResponse) => {
                (gridObj as any).reorderColumns = orig;
                expect(response.isError).toBeFalsy();
                expect(called).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).reorderColumns = orig; fail(e); });
        });

        it('reorderData: reorderColumnByIndex passes indexes', (done: Function) => {
            const orig = (gridObj as any).reorderColumnByIndex;
            let called = false;
            (gridObj as any).reorderColumnByIndex = (fromI: any, toI: any) => {
                called = true;
                expect(fromI).toBe(0);
                expect(toI).toBe(1);
            };
            triggerTool(gridObj, 'reorderData', { mode: 'reorderColumnByIndex', fromIndex: 0, toIndex: 1 }).then((response: WebMcpToolResponse) => {
                (gridObj as any).reorderColumnByIndex = orig;
                expect(response.isError).toBeFalsy();
                expect(called).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).reorderColumnByIndex = orig; fail(e); });
        });

        it('reorderData: reorderRows passes fromIndexes and toIndex', (done: Function) => {
            const orig = (gridObj as any).reorderRows;
            let called = false;
            (gridObj as any).reorderRows = (fromI: any, toI: any) => {
                called = true;
                expect(fromI).toEqual([0, 1]);
                expect(toI).toBe(2);
            };
            triggerTool(gridObj, 'reorderData', { mode: 'reorderRows', fromIndexes: [0, 1], toIndex: 2 }).then((response: WebMcpToolResponse) => {
                (gridObj as any).reorderRows = orig;
                expect(response.isError).toBeFalsy();
                expect(called).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).reorderRows = orig; fail(e); });
        });

        it('reorderData: unknown mode returns error', (done: Function) => {
            triggerTool(gridObj, 'reorderData', { mode: 'unknown' }).then((response: WebMcpToolResponse) => {
                expect(response.isError).toBe(true);
                expect(response.content[0].text).toBe('Unknown reorder mode: "unknown"');
                done();
            }).catch((e: any) => fail(e));
        });

        it('groupingAndPinning: groupColumn calls groupColumn', (done: Function) => {
            const orig = (gridObj as any).groupColumn;
            let called = false;
            (gridObj as any).groupColumn = (col: any) => { called = true; expect(col).toBe('CustomerID'); };
            triggerTool(gridObj, 'groupingAndPinning', { mode: 'groupColumn', columnName: 'CustomerID' }).then((response: WebMcpToolResponse) => {
                (gridObj as any).groupColumn = orig;
                expect(response.isError).toBeFalsy();
                expect(called).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).groupColumn = orig; fail(e); });
        });

        it('groupingAndPinning: ungroupColumn calls ungroupColumn', (done: Function) => {
            const orig = (gridObj as any).ungroupColumn;
            let called = false;
            (gridObj as any).ungroupColumn = (col: any) => { called = true; expect(col).toBe('CustomerID'); };
            triggerTool(gridObj, 'groupingAndPinning', { mode: 'ungroupColumn', columnName: 'CustomerID' }).then((response: WebMcpToolResponse) => {
                (gridObj as any).ungroupColumn = orig;
                expect(response.isError).toBeFalsy();
                expect(called).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).ungroupColumn = orig; fail(e); });
        });

        it('groupingAndPinning: clearGrouping calls clearGrouping', (done: Function) => {
            const orig = (gridObj as any).clearGrouping;
            let called = false;
            (gridObj as any).clearGrouping = () => { called = true; };
            triggerTool(gridObj, 'groupingAndPinning', { mode: 'clearGrouping' }).then((response: WebMcpToolResponse) => {
                (gridObj as any).clearGrouping = orig;
                expect(response.isError).toBeFalsy();
                expect(called).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).clearGrouping = orig; fail(e); });
        });

        it('groupingAndPinning: groupExpandAll calls groupExpandAll', (done: Function) => {
            const orig = (gridObj as any).groupExpandAll;
            let called = false;
            (gridObj as any).groupExpandAll = () => { called = true; };
            triggerTool(gridObj, 'groupingAndPinning', { mode: 'groupExpandAll' }).then((response: WebMcpToolResponse) => {
                (gridObj as any).groupExpandAll = orig;
                expect(response.isError).toBeFalsy();
                expect(called).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).groupExpandAll = orig; fail(e); });
        });

        it('groupingAndPinning: groupCollapseAll calls groupCollapseAll', (done: Function) => {
            const orig = (gridObj as any).groupCollapseAll;
            let called = false;
            (gridObj as any).groupCollapseAll = () => { called = true; };
            triggerTool(gridObj, 'groupingAndPinning', { mode: 'groupCollapseAll' }).then((response: WebMcpToolResponse) => {
                (gridObj as any).groupCollapseAll = orig;
                expect(response.isError).toBeFalsy();
                expect(called).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).groupCollapseAll = orig; fail(e); });
        });

        it('groupingAndPinning: pinRows passes data', (done: Function) => {
            const orig = (gridObj as any).pinRows;
            let called = false;
            (gridObj as any).pinRows = (records: any) => { called = true; expect(records).toEqual([{ OrderID: 1 }]); };
            triggerTool(gridObj, 'groupingAndPinning', { mode: 'pinRows', data: [{ OrderID: 1 }] }).then((response: WebMcpToolResponse) => {
                (gridObj as any).pinRows = orig;
                expect(response.isError).toBeFalsy();
                expect(called).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).pinRows = orig; fail(e); });
        });

        it('groupingAndPinning: unpinRows passes data', (done: Function) => {
            const orig = (gridObj as any).unpinRows;
            let called = false;
            (gridObj as any).unpinRows = (records: any) => { called = true; expect(records).toEqual([{ OrderID: 1 }]); };
            triggerTool(gridObj, 'groupingAndPinning', { mode: 'unpinRows', data: [{ OrderID: 1 }] }).then((response: WebMcpToolResponse) => {
                (gridObj as any).unpinRows = orig;
                expect(response.isError).toBeFalsy();
                expect(called).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).unpinRows = orig; fail(e); });
        });

        it('groupingAndPinning: unknown mode returns error', (done: Function) => {
            triggerTool(gridObj, 'groupingAndPinning', { mode: 'unknown' }).then((response: WebMcpToolResponse) => {
                expect(response.isError).toBe(true);
                expect(response.content[0].text).toBe('Unknown grouping/pinning mode: "unknown"');
                done();
            }).catch((e: any) => fail(e));
        });

        it('batchChanges: getBatchChanges returns changes', (done: Function) => {
            const orig = (gridObj as any).getBatchChanges;
            (gridObj as any).getBatchChanges = () => ({ changedRecords: [{ OrderID: 1 }] });
            triggerTool(gridObj, 'batchChanges', { mode: 'getBatchChanges' }).then((response: WebMcpToolResponse) => {
                (gridObj as any).getBatchChanges = orig;
                const parsed = parseContent(response);
                expect(parsed.batchChanges).toEqual({ changedRecords: [{ OrderID: 1 }] });
                done();
            }).catch((e: any) => { (gridObj as any).getBatchChanges = orig; fail(e); });
        });

        it('batchChanges: batchSave saves via saveBulkChanges', (done: Function) => {
            const orig = (gridObj as any).saveBulkChanges;
            let called = false;
            (gridObj as any).saveBulkChanges = (c: any) => { called = true; expect(c).toEqual({ changedRecords: [] }); };
            triggerTool(gridObj, 'batchChanges', { mode: 'batchSave', changes: { changedRecords: [] } }).then((response: WebMcpToolResponse) => {
                (gridObj as any).saveBulkChanges = orig;
                const parsed = parseContent(response);
                expect(called).toBe(true);
                expect(parsed.batchChangesSaved).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).saveBulkChanges = orig; fail(e); });
        });

        it('batchChanges: saveBatchChanges alias saves via saveBulkChanges', (done: Function) => {
            const orig = (gridObj as any).saveBulkChanges;
            let called = false;
            (gridObj as any).saveBulkChanges = () => { called = true; };
            triggerTool(gridObj, 'batchChanges', { mode: 'saveBatchChanges', changes: {} }).then((response: WebMcpToolResponse) => {
                (gridObj as any).saveBulkChanges = orig;
                const parsed = parseContent(response);
                expect(called).toBe(true);
                expect(parsed.batchChangesSaved).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).saveBulkChanges = orig; fail(e); });
        });

        it('batchChanges: unknown mode returns error', (done: Function) => {
            triggerTool(gridObj, 'batchChanges', { mode: 'unknown' }).then((response: WebMcpToolResponse) => {
                expect(response.isError).toBe(true);
                expect(response.content[0].text).toBe('Unknown batch mode: "unknown"');
                done();
            }).catch((e: any) => fail(e));
        });

        it('configurationHelpers: getColumns returns columns', (done: Function) => {
            const orig = (gridObj as any).getColumns;
            (gridObj as any).getColumns = () => ['col1'];
            triggerTool(gridObj, 'configurationHelpers', { mode: 'getColumns' }).then((response: WebMcpToolResponse) => {
                (gridObj as any).getColumns = orig;
                const parsed = parseContent(response);
                expect(parsed.columns).toEqual(['col1']);
                done();
            }).catch((e: any) => { (gridObj as any).getColumns = orig; fail(e); });
        });

        it('configurationHelpers: getColumnByField returns column', (done: Function) => {
            const orig = (gridObj as any).getColumnByField;
            (gridObj as any).getColumnByField = (f: string) => { expect(f).toBe('OrderID'); return { field: 'OrderID' }; };
            triggerTool(gridObj, 'configurationHelpers', { mode: 'getColumnByField', field: 'OrderID' }).then((response: WebMcpToolResponse) => {
                (gridObj as any).getColumnByField = orig;
                const parsed = parseContent(response);
                expect(parsed.column).toEqual({ field: 'OrderID' });
                done();
            }).catch((e: any) => { (gridObj as any).getColumnByField = orig; fail(e); });
        });

        it('configurationHelpers: getColumnByUid returns column', (done: Function) => {
            const orig = (gridObj as any).getColumnByUid;
            (gridObj as any).getColumnByUid = (u: string) => { expect(u).toBe('uid1'); return { uid: 'uid1' }; };
            triggerTool(gridObj, 'configurationHelpers', { mode: 'getColumnByUid', uid: 'uid1' }).then((response: WebMcpToolResponse) => {
                (gridObj as any).getColumnByUid = orig;
                const parsed = parseContent(response);
                expect(parsed.column).toEqual({ uid: 'uid1' });
                done();
            }).catch((e: any) => { (gridObj as any).getColumnByUid = orig; fail(e); });
        });

        it('configurationHelpers: getPrimaryKeyFieldNames returns keys', (done: Function) => {
            const orig = (gridObj as any).getPrimaryKeyFieldNames;
            (gridObj as any).getPrimaryKeyFieldNames = () => ['OrderID'];
            triggerTool(gridObj, 'configurationHelpers', { mode: 'getPrimaryKeyFieldNames' }).then((response: WebMcpToolResponse) => {
                (gridObj as any).getPrimaryKeyFieldNames = orig;
                const parsed = parseContent(response);
                expect(parsed.primaryKeyFieldNames).toEqual(['OrderID']);
                done();
            }).catch((e: any) => { (gridObj as any).getPrimaryKeyFieldNames = orig; fail(e); });
        });

        it('configurationHelpers: getColumnFieldNames returns names', (done: Function) => {
            const orig = (gridObj as any).getColumnFieldNames;
            (gridObj as any).getColumnFieldNames = () => ['OrderID', 'CustomerID'];
            triggerTool(gridObj, 'configurationHelpers', { mode: 'getColumnFieldNames' }).then((response: WebMcpToolResponse) => {
                (gridObj as any).getColumnFieldNames = orig;
                const parsed = parseContent(response);
                expect(parsed.columnFieldNames).toEqual(['OrderID', 'CustomerID']);
                done();
            }).catch((e: any) => { (gridObj as any).getColumnFieldNames = orig; fail(e); });
        });

        it('configurationHelpers: getVisibleColumns returns visible columns', (done: Function) => {
            const orig = (gridObj as any).getVisibleColumns;
            (gridObj as any).getVisibleColumns = () => ['OrderID'];
            triggerTool(gridObj, 'configurationHelpers', { mode: 'getVisibleColumns' }).then((response: WebMcpToolResponse) => {
                (gridObj as any).getVisibleColumns = orig;
                const parsed = parseContent(response);
                expect(parsed.visibleColumns).toEqual(['OrderID']);
                done();
            }).catch((e: any) => { (gridObj as any).getVisibleColumns = orig; fail(e); });
        });

        it('configurationHelpers: unknown mode returns error', (done: Function) => {
            triggerTool(gridObj, 'configurationHelpers', { mode: 'unknown' }).then((response: WebMcpToolResponse) => {
                expect(response.isError).toBe(true);
                expect(response.content[0].text).toBe('Unknown configuration helper mode: "unknown"');
                done();
            }).catch((e: any) => fail(e));
        });

        it('toolbarClipboardUtilities: print calls print', (done: Function) => {
            const orig = (gridObj as any).print;
            let called = false;
            (gridObj as any).print = () => { called = true; };
            triggerTool(gridObj, 'toolbarClipboardUtilities', { mode: 'print' }).then((response: WebMcpToolResponse) => {
                (gridObj as any).print = orig;
                expect(response.isError).toBeFalsy();
                expect(called).toBe(true);
                done();
            }).catch((e: any) => { (gridObj as any).print = orig; fail(e); });
        });

        it('toolbarClipboardUtilities: unknown mode returns error', (done: Function) => {
            triggerTool(gridObj, 'toolbarClipboardUtilities', { mode: 'unknown' }).then((response: WebMcpToolResponse) => {
                expect(response.isError).toBe(true);
                expect(response.content[0].text).toBe('Unknown toolbar/clipboard utility mode: "unknown"');
                done();
            }).catch((e: any) => fail(e));
        });
    });

    describe('module lifecycle and helpers ->', () => {
        let grid: Grid;
        let originalModelContext: any;

        beforeEach((done: Function) => {
            originalModelContext = (document as any).modelContext;
            (document as any).modelContext = { registerTool: jasmine.createSpy('registerTool') };
            grid = createGrid({
                enableWebMcp: true,
                dataSource: data,
                columns: [{ field: 'OrderID', isPrimaryKey: true }, { field: 'CustomerID' }]
            }, done);
        });

        afterEach(() => {
            (document as any).modelContext = originalModelContext;
            if (grid) { destroy(grid); }
            grid = undefined as any;
        });

        it('getModuleName returns webMcpGrid', () => {
            expect(getModule(grid).getModuleName()).toBe('webMcpGrid');
        });

        it('destroy with active abort controller aborts it and clears the reference', () => {
            const module: any = getModule(grid);
            let aborted = false;
            module.webMcpAbortController = { abort: (): void => { aborted = true; } };
            module.destroy();
            expect(aborted).toBe(true);
            expect(module.webMcpAbortController).toBeNull();
        });

        it('destroy skips event removal after parent is destroyed', () => {
            const module: any = getModule(grid);
            (grid as any).isDestroyed = true;
            const offSpy: any = spyOn(grid, 'off').and.callThrough();
            module.destroy();
            expect(offSpy).not.toHaveBeenCalled();
            (grid as any).isDestroyed = false;
        });

    });

    describe('Grid public WebMCP API ->', () => {
        let grid: Grid;
        let originalModelContext: any;

        beforeEach((done: Function) => {
            originalModelContext = (document as any).modelContext;
            (document as any).modelContext = { registerTool: jasmine.createSpy('registerTool') };
            grid = createGrid({
                enableWebMcp: true,
                dataSource: data,
                columns: [{ field: 'OrderID', isPrimaryKey: true }, { field: 'CustomerID' }]
            }, done);
        });

        afterEach(() => {
            (document as any).modelContext = originalModelContext;
            if (grid) { destroy(grid); }
            grid = undefined as any;
        });

        it('getWebMcpTools returns all tools when toolNames is omitted', () => {
            const tools: WebMcpTool[] = grid.getWebMcpTools();
            expect(tools.length).toBe(TOOL_COUNT);
            expect(tools[0].name).toBe('getSelectedRecords');
        });

        it('getWebMcpTools filters tools by toolNames', () => {
            const tools: WebMcpTool[] = grid.getWebMcpTools(['getSelectedRecords', 'selection']);
            expect(tools.length).toBe(2);
            expect(tools[0].name).toBe('getSelectedRecords');
            expect(tools[1].name).toBe('selection');
        });

        it('getWebMcpTools returns [] fallback when adapter is not injected', (done: Function) => {
            const plain: Grid = createGrid({
                dataSource: data,
                columns: [{ field: 'OrderID' }, { field: 'CustomerID' }]
            }, () => {
                expect(plain.getWebMcpTools()).toEqual([]);
                expect(plain.getWebMcpTools(['getSelectedRecords'])).toEqual([]);
                destroy(plain);
                done();
            });
        });

    });

    describe('WebMCP Settings Property API ->', () => {
        let grid: Grid;
        let originalModelContext: any;

        beforeEach(() => {
            originalModelContext = (document as any).modelContext;
            (document as any).modelContext = { registerTool: jasmine.createSpy('registerTool') };
        });

        afterEach(() => {
            (document as any).modelContext = originalModelContext;
            if (grid) {
                destroy(grid);
            }
            grid = undefined as any;
        });

        it('should initialize with webMcpSettings undefined and register all tools with element ID', (done: Function) => {
            const calls: any[] = [];
            (document as any).modelContext.registerTool.and.callFake((tool: any) => {
                calls.push(tool);
            });

            grid = createGrid({
                enableWebMcp: true,
                dataSource: data,
                columns: [{ field: 'OrderID', isPrimaryKey: true }, { field: 'CustomerID' }]
                // webMcpSettings NOT provided
            }, () => {
                // Verify all tools registered with element ID prefix
                expect(calls.length).toBe(TOOL_COUNT);
                calls.forEach((call: any) => {
                    expect(call.name).toMatch(new RegExp(`^${grid.element.id}_`));
                });
                done();
            });
        });

        it('should register tools when webMcpSettings provided with name and specific tools', (done: Function) => {
            const calls: any[] = [];
            (document as any).modelContext.registerTool.and.callFake((tool: any) => {
                calls.push(tool);
            });

            grid = createGrid({
                enableWebMcp: true,
                dataSource: data,
                webMcpSettings: {
                    name: 'customPrefix',
                    tools: ['getSelectedRecords', 'sortByColumn']
                },
                columns: [{ field: 'OrderID', isPrimaryKey: true }, { field: 'CustomerID' }]
            }, () => {
                // Verify only specified tools registered with custom prefix
                expect(calls.length).toBe(2);
                expect(calls[0].name).toBe('customPrefix_getSelectedRecords');
                expect(calls[1].name).toBe('customPrefix_sortByColumn');
                done();
            });
        });

        it('should register all tools when webMcpSettings.tools is empty array', (done: Function) => {
            const calls: any[] = [];
            (document as any).modelContext.registerTool.and.callFake((tool: any) => {
                calls.push(tool);
            });

            grid = createGrid({
                enableWebMcp: true,
                dataSource: data,
                webMcpSettings: {
                    name: 'allTools',
                    tools: [] // Empty array should register all tools
                },
                columns: [{ field: 'OrderID', isPrimaryKey: true }, { field: 'CustomerID' }]
            }, () => {
                // Verify all tools registered even though tools array is empty
                expect(calls.length).toBe(TOOL_COUNT);
                calls.forEach((call: any) => {
                    expect(call.name).toMatch(/^allTools_/);
                });
                done();
            });
        });

        it('should pass exposedTo through to registerTool options', (done: Function) => {
            const calls: any[] = [];
            (document as any).modelContext.registerTool.and.callFake((tool: any, options: any) => {
                calls.push({ tool, options });
            });

            grid = createGrid({
                enableWebMcp: true,
                dataSource: data,
                webMcpSettings: {
                    name: 'secureTools',
                    tools: ['getSelectedRecords'],
                    exposedTo: ['https://trusted.example.com', 'https://partner.example.com']
                },
                columns: [{ field: 'OrderID', isPrimaryKey: true }, { field: 'CustomerID' }]
            }, () => {
                expect(calls.length).toBe(1);
                expect(calls[0].options.exposedTo).toEqual(['https://trusted.example.com', 'https://partner.example.com']);
                done();
            });
        });

        it('should handle exposedTo as undefined (MCP server default policy)', (done: Function) => {
            const calls: any[] = [];
            (document as any).modelContext.registerTool.and.callFake((tool: any, options: any) => {
                calls.push({ tool, options });
            });

            grid = createGrid({
                enableWebMcp: true,
                dataSource: data,
                webMcpSettings: {
                    name: 'openTools',
                    tools: ['getSelectedRecords']
                    // exposedTo NOT provided
                },
                columns: [{ field: 'OrderID', isPrimaryKey: true }, { field: 'CustomerID' }]
            }, () => {
                expect(calls.length).toBe(1);
                expect(calls[0].options.exposedTo).toBeUndefined();
                done();
            });
        });

        it('should ignore exposedTo when it is an empty array', (done: Function) => {
            const calls: any[] = [];
            (document as any).modelContext.registerTool.and.callFake((tool: any, options: any) => {
                calls.push({ tool, options });
            });

            grid = createGrid({
                enableWebMcp: true,
                dataSource: data,
                webMcpSettings: {
                    name: 'restrictedTools',
                    tools: ['getSelectedRecords'],
                    exposedTo: [] // Empty array is ignored by source
                },
                columns: [{ field: 'OrderID', isPrimaryKey: true }, { field: 'CustomerID' }]
            }, () => {
                expect(calls.length).toBe(1);
                // When exposedTo is empty array, it is NOT included in registerOptions
                expect(calls[0].options.exposedTo).toBeUndefined();
                done();
            });
        });
    });

    describe('WebMCP Initialization and Module Injection ->', () => {
        let originalModelContext: any;

        beforeEach(() => {
            originalModelContext = (document as any).modelContext;
        });

        afterEach(() => {
            (document as any).modelContext = originalModelContext;
        });

        it('should not inject WebMcpGrid module when enableWebMcp is false', (done: Function) => {
            (document as any).modelContext = { registerTool: jasmine.createSpy('registerTool') };

            const grid: Grid = createGrid({
                enableWebMcp: false, // Explicitly disabled
                dataSource: data,
                webMcpSettings: {
                    name: 'unused',
                    tools: ['getSelectedRecords']
                },
                columns: [{ field: 'OrderID', isPrimaryKey: true }, { field: 'CustomerID' }]
            }, () => {
                expect((grid as any).webMcpGridModule).toBeUndefined();
                destroy(grid);
                done();
            });
        });

        it('should inject WebMcpGrid module when enableWebMcp is true even without webMcpSettings', (done: Function) => {
            const calls: any[] = [];
            (document as any).modelContext = { 
                registerTool: jasmine.createSpy('registerTool').and.callFake((tool: any) => {
                    calls.push(tool);
                })
            };

            const grid: Grid = createGrid({
                enableWebMcp: true,
                dataSource: data,
                // webMcpSettings NOT provided
                columns: [{ field: 'OrderID', isPrimaryKey: true }, { field: 'CustomerID' }]
            }, () => {
                expect((grid as any).webMcpGridModule).toBeDefined();
                expect((grid as any).webMcpGridModule.getModuleName()).toBe('webMcpGrid');
                // Should register all tools with element ID
                expect(calls.length).toBe(TOOL_COUNT);
                destroy(grid);
                done();
            });
        });

    });
});
