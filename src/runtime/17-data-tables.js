const __dataTableCall = async function(endpoint, body) {
  if (!__runnerOperations.available) {
    throw new Error('Data Table runtime API is not available for this run.');
  }
  const response = await __runnerOperations[endpoint](body);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const validationError = payload && payload.errors
      ? Object.values(payload.errors).flat().find(value => typeof value === 'string')
      : null;
    throw new Error(validationError || payload.message || ('Data Table request failed with HTTP ' + response.status + '.'));
  }
  return payload.data;
};

const __dataTableObject = function(value, label) {
  if (value == null) return {};
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(label + ' must be an object.');
  }
  return value;
};

const __dataTableOptions = function(options) {
  if (options == null) return {};
  return __dataTableObject(options, 'Data Table options');
};

/* @help Data Tables
 * @sig $dataTableInsertRow(tableId, values)
 * @desc Insert one row into a Data Table and return the complete stored row.
 * @nodal-desc Insert a row into a Data Table.
 * @nodal-output object
 * @availability both
 * @nodal-param tableId [data-table, required]: Data Table receiving the new row.
 * @nodal-param values [data-table-values, required]: Values keyed by column name.
 */
const $dataTableInsertRow = async function(tableId, values) {
  return await __dataTableCall('dataTableWrite', {
    operation: 'insertRow',
    tableId,
    values,
  });
};

/* @help Data Tables
 * @sig $dataTableUpdateRows(tableId, filters, values, options?)
 * @desc Update rows matching all or any filters. Set options.updateAll to explicitly update every row and options.dryRun to preview before and after rows.
 * @nodal-desc Update matching rows in a Data Table.
 * @nodal-output array<object>
 * @availability both
 * @nodal-param tableId [data-table, required]: Data Table to update.
 * @nodal-param filters [data-table-filters, required]: Typed row filters.
 * @nodal-param values [data-table-values, required]: Replacement values keyed by column name.
 * @nodal-param options [object]: Matching and execution options.
 * @nodal-param options.matchType: Combine filters using allConditions or anyCondition.
 * @nodal-param options.updateAll [boolean]: Explicitly allow updating every row when no filters are provided.
 * @nodal-param options.dryRun [boolean]: Preview before and after rows without persisting changes.
 */
const $dataTableUpdateRows = async function(tableId, filters, values, options = {}) {
  const opts = __dataTableOptions(options);
  return await __dataTableCall('dataTableWrite', {
    operation: 'updateRows',
    tableId,
    filters,
    values,
    matchType: opts.matchType,
    updateAll: opts.updateAll === true,
    dryRun: opts.dryRun === true,
  });
};

/* @help Data Tables
 * @sig $dataTableUpsertRows(tableId, filters, values, options?)
 * @desc Update rows matching the filters, or insert one row when no match exists. The operation is serialized per table.
 * @nodal-desc Update matching rows or insert a new row.
 * @nodal-output array<object>
 * @availability both
 * @nodal-param tableId [data-table, required]: Data Table to update or insert into.
 * @nodal-param filters [data-table-filters, required]: Typed row filters used to find existing rows.
 * @nodal-param values [data-table-values, required]: Values keyed by column name.
 * @nodal-param options [object]: Matching and execution options.
 * @nodal-param options.matchType: Combine filters using allConditions or anyCondition.
 * @nodal-param options.dryRun [boolean]: Preview before and after rows without persisting changes.
 */
const $dataTableUpsertRows = async function(tableId, filters, values, options = {}) {
  const opts = __dataTableOptions(options);
  return await __dataTableCall('dataTableWrite', {
    operation: 'upsertRows',
    tableId,
    filters,
    values,
    matchType: opts.matchType,
    dryRun: opts.dryRun === true,
  });
};

/* @help Data Tables
 * @sig $dataTableRowExists(tableId, filters, options?)
 * @desc Return true when at least one row matches the filters.
 * @nodal-desc Branch depending on whether a matching row exists.
 * @nodal-output boolean
 * @nodal-flow-port true [branch]: True
 * @nodal-flow-port false [branch]: False
 * @availability both
 * @nodal-param tableId [data-table, required]: Data Table to search.
 * @nodal-param filters [data-table-filters, required]: Typed row filters.
 * @nodal-param options [object]: Matching options.
 * @nodal-param options.matchType: Combine filters using allConditions or anyCondition.
 */
const $dataTableRowExists = async function(tableId, filters, options = {}) {
  const opts = __dataTableOptions(options);
  return await __dataTableCall('dataTableRead', {
    operation: 'rowExists',
    tableId,
    filters,
    matchType: opts.matchType,
  });
};

/* @help Data Tables
 * @sig $dataTableRowDoesNotExist(tableId, filters, options?)
 * @desc Return true when no row matches the filters.
 * @nodal-desc Branch depending on whether no matching row exists.
 * @nodal-output boolean
 * @nodal-flow-port true [branch]: True
 * @nodal-flow-port false [branch]: False
 * @availability both
 * @nodal-param tableId [data-table, required]: Data Table to search.
 * @nodal-param filters [data-table-filters, required]: Typed row filters.
 * @nodal-param options [object]: Matching options.
 * @nodal-param options.matchType: Combine filters using allConditions or anyCondition.
 */
const $dataTableRowDoesNotExist = async function(tableId, filters, options = {}) {
  const opts = __dataTableOptions(options);
  return await __dataTableCall('dataTableRead', {
    operation: 'rowDoesNotExist',
    tableId,
    filters,
    matchType: opts.matchType,
  });
};

/* @help Data Tables
 * @sig $dataTableGetRows(tableId, filters?, options?)
 * @desc Return rows matching typed filters with optional AND or OR matching, sorting, limits, and returnAll.
 * @nodal-desc Get matching rows from a Data Table.
 * @nodal-output array<object>
 * @availability both
 * @nodal-param tableId [data-table, required]: Data Table to query.
 * @nodal-param filters [data-table-filters]: Typed row filters.
 * @nodal-param options [object]: Matching, sorting, and limit options.
 * @nodal-param options.matchType: Combine filters using allConditions or anyCondition.
 * @nodal-param options.returnAll [boolean]: Return every matching row.
 * @nodal-param options.limit [number]: Maximum number of rows when returnAll is false.
 * @nodal-param options.orderBy: Column name used for sorting.
 * @nodal-param options.direction: Sort direction, asc or desc.
 */
const $dataTableGetRows = async function(tableId, filters = [], options = {}) {
  const opts = __dataTableOptions(options);
  return await __dataTableCall('dataTableRead', {
    operation: 'getRows',
    tableId,
    filters,
    matchType: opts.matchType,
    returnAll: opts.returnAll === true,
    limit: opts.limit == null ? 50 : opts.limit,
    orderBy: opts.orderBy,
    direction: opts.direction,
  });
};

/* @help Data Tables
 * @sig $dataTableDeleteRows(tableId, filters, options?)
 * @desc Delete rows matching typed filters, or preview the deletion with options.dryRun.
 * @nodal-desc Delete matching rows from a Data Table.
 * @nodal-output array<object>
 * @availability both
 * @nodal-param tableId [data-table, required]: Data Table to delete from.
 * @nodal-param filters [data-table-filters, required]: Typed row filters. Empty filters are rejected.
 * @nodal-param options [object]: Matching and execution options.
 * @nodal-param options.matchType: Combine filters using allConditions or anyCondition.
 * @nodal-param options.dryRun [boolean]: Preview before and after rows without deleting anything.
 */
const $dataTableDeleteRows = async function(tableId, filters, options = {}) {
  const opts = __dataTableOptions(options);
  return await __dataTableCall('dataTableWrite', {
    operation: 'deleteRows',
    tableId,
    filters,
    matchType: opts.matchType,
    dryRun: opts.dryRun === true,
  });
};

/* @help Data Tables
 * @sig $dataTableCreate(name, columns?, options?)
 * @desc Create a physical data table with automatic id, created_at, and updated_at columns.
 * @nodal-desc Create a Data Table.
 * @nodal-output object
 * @availability both
 * @nodal-param name [string, required]: Unique Data Table name inside the workspace.
 * @nodal-param columns [data-table-columns]: Custom string, number, boolean, or datetime columns.
 * @nodal-param options [object]: Data Table metadata.
 * @nodal-param options.description [string]: Description of the Data Table.
 * @nodal-param options.visibility [string]: Visibility scope: owner, workspace, or team.
 * @nodal-param options.ownerId [string]: User who owns the Data Table.
 * @nodal-param options.teamId [string]: Team that can access a team-visible Data Table.
 */
const $dataTableCreate = async function(name, columns = [], options = {}) {
  const opts = __dataTableOptions(options);
  return await __dataTableCall('dataTableSchema', {
    operation: 'create',
    name,
    columns,
    description: opts.description,
    visibility: opts.visibility,
    ownerId: opts.ownerId,
    teamId: opts.teamId,
  });
};

/* @help Data Tables
 * @sig $dataTableDelete(tableId)
 * @desc Permanently delete a Data Table and all of its rows.
 * @nodal-desc Delete a Data Table.
 * @nodal-output object
 * @availability both
 * @nodal-param tableId [data-table, required]: Data Table to permanently delete.
 */
const $dataTableDelete = async function(tableId) {
  return await __dataTableCall('dataTableSchema', {
    operation: 'delete',
    tableId,
  });
};

/* @help Data Tables
 * @sig $dataTableList(options?)
 * @desc List Data Tables visible to the flow run actor.
 * @nodal-desc List visible Data Tables.
 * @nodal-output array<object>
 * @availability both
 * @nodal-param options [object]: Optional list filters.
 * @nodal-param options.visibility [string]: Filter by visibility.
 * @nodal-param options.ownerId [string]: Filter by owner.
 * @nodal-param options.teamId [string]: Filter by team.
 */
const $dataTableList = async function(options = {}) {
  const opts = __dataTableOptions(options);
  return await __dataTableCall('dataTableRead', {
    operation: 'list',
    visibility: opts.visibility,
    ownerId: opts.ownerId,
    teamId: opts.teamId,
  });
};

/* @help Data Tables
 * @sig $dataTableUpdate(tableId, changes)
 * @desc Update Data Table metadata without changing physical storage or column types.
 * @nodal-desc Update a Data Table.
 * @nodal-output object
 * @availability both
 * @nodal-param tableId [data-table, required]: Data Table to update.
 * @nodal-param changes [object, required]: Data Table metadata changes.
 * @nodal-param changes.name [string]: New unique Data Table name.
 * @nodal-param changes.description [string]: New Data Table description.
 * @nodal-param changes.visibility [string]: New visibility scope: owner, workspace, or team.
 * @nodal-param changes.ownerId [string]: New owner user ID.
 * @nodal-param changes.teamId [string]: New team ID, or null to remove the team.
 */
const $dataTableUpdate = async function(tableId, changes) {
  return await __dataTableCall('dataTableSchema', {
    operation: 'update',
    tableId,
    changes: __dataTableObject(changes, 'Data Table changes'),
  });
};
