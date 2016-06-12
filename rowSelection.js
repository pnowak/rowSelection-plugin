import BasePlugin from './../_base';
import {registerPlugin, getPlugin} from './../../plugins';
import {addClass, hasClass, removeClass} from './../../helpers/dom/element';
import {arrayEach, arrayFilter} from './../../helpers/array';
import {EventManager} from './../../eventManager';

/**
 * @plugin RowSelection
 *
 * @description
 * This plugin allows injected checkbox in row header
 *
 * @example
 * ```js
 * ...
 * // as boolean
 * rowSelection: true
 * ...
 * // as a object
 * rowSelection: {
 *  checkboxPosition: 'after', // default null
 *  selectableRows: [2, 4, 6, 8, 10] or [[1, 5], 10], // default undefined
 *  selectedRows: [2, 10] // default undefined
 *  selectHiddenRows: true, // default false
 *  selectHiddenColumns: false // default false
 * }
 *
 */
class RowSelection extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);
    /**
     * Instance of {@link EventManager}.
     *
     * @private
     * @type {EventManager}
     */
    this.eventManager = null;
    /**
     * Cached settings from Handsontable settings.
     *
     * @type {Object}
     */
    this.settings = {};
    /**
     * Cached reference to the HiddenRows plugin.
     *
     * @type {Object}
     */
    this.hiddenRowsPlugin = null;
    /**
     * return data from hidding rows or not
     *
     * @type {Boolean}
     */
    this.selectHiddenRows = void 0;
    /**
     * Cached reference to the HiddenColumns plugin.
     *
     * @type {Object}
     */
    this.hiddenColumnsPlugin = null;
    /**
     * return data from hidding columns or not
     *
     * @type {Boolean}
     */
    this.selectHiddenColumns = void 0;
    /**
     * position input, 'after' 'before' or undefined (replace)
     *
     * @type {String}
     */
    this.checkboxPosition = void 0;
    /**
     * define which rows is selectable
     *
     * @type {Array}
     */
    this.selectableRows = void 0;
    /**
     * define which rows from selectableRows is selected just after Handsontable init
     *
     * @type {Array}
     */
    this.selectedRows = void 0;
    /**
     * configuration function to determine which rows are selectable
     *
     * @type {Fuction}
     */
    this.isRowSelectable = void 0;
    /**
     * selected data
     *
     * @type {Object Map}
     */
    this.selectedData = new Map();
  }

  /**
   * Checks if the plugin is enabled in the settings.
   */
  isEnabled() {
    return !!this.hot.getSettings().rowSelection;
  }

  /**
   * Enable the plugin.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    if (!this.eventManager) {
      this.eventManager = new EventManager(this);
    }

    this.hiddenRowsPlugin = this.hot.getPlugin('hiddenRows');
    this.hiddenColumnsPlugin = this.hot.getPlugin('hiddenColumns');

    let settings = this.hot.getSettings().rowSelection;

    if (settings === true) {
      this.addHook('afterInit', () => this.insertRowHeaderCheckbox());
    }

    if (typeof settings === 'object') {
      this.settings = settings;

      if (settings.selectableRows === undefined) {
        settings.selectableRows = this.settings.selectableRows;

      } else if (Array.isArray([...settings.selectableRows])) {
        let rows = [];
        for (let i = 0, len = settings.selectableRows.length; i < len; i += 1) {
          if (Array.isArray(settings.selectableRows[i])) {
            const [start, stop] = settings.selectableRows[i];

            for (let j = start; j <= stop; j += 1) {
              rows.push(j);
            }
          } else {
            rows.push(settings.selectableRows[i]);
          }
        }
        settings.selectableRows = rows;
      }

      if (typeof settings.checkboxPosition === 'undefined') {
        this.addHook('afterInit', () => this.insertRowHeaderCheckbox());
      } else {
        this.addHook('afterInit', () => this.insertRowHeaderCheckbox(settings.checkboxPosition));
      }

      if (typeof settings.isRowSelectable === 'function') {
        this.isRowSelectable = settings.isRowSelectable;
      }

      if (typeof settings.selectedRows !== 'undefined') {
        this.addHook('afterInit', () => this.checkSelectedRows());
      }
    }

    this.registerEvents();
    super.enablePlugin();
  }

  /**
   * Register all necessary DOM listeners.
   *
   * @private
   */
  registerEvents() {
    this.eventManager.addEventListener(this.hot.rootElement, 'change', (e) => this.clickCheckbox(e));
    this.eventManager.addEventListener(this.hot.rootElement, 'change', () => this.getSelectedValues());
  }

  /**
   * Update plugin
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();

    super.updatePlugin();
  }

  /**
   * Disable the plugin
   */
  disablePlugin() {
    this.settings = null;
    this.selectedData.clear();
    this.hiddenRowsPlugin = null;
    this.hiddenColumnsPlugin = null;

    super.disablePlugin();
  }

  /**
   *
   * check all checkbox
   */
  checkAll() {
    const {arrayInputs, tbody, selectable} = this.checkedConstant();

    arrayEach(arrayInputs, (input, index) => {
      input = arrayInputs[index];
      index = selectable === undefined ? index : parseInt(selectable[index], 10);

      input.checked = true;
      addClass(tbody.rows[index], 'checked');

      if (!(this.selectedData.has(tbody.rows[index])) && !((this.settings.selectHiddenRows) && (this.hiddenRowsPlugin.isHidden(index)))) {
        this.addSelectedData(tbody.rows, index, tbody.rows[index].rowIndex - 1);
      }
      if ((this.settings.selectHiddenColumns) && (this.hiddenColumnsPlugin.hiddenColumns.length)) {
        this.checkIfHidden(tbody.rows, index);
      }
    });

    this.getSelectedValues();
  }

  /**
   *
   * uncheck all checkbox
   */
  uncheckAll() {
    const {arrayInputs, tbody, selectable} = this.checkedConstant();

    arrayEach(arrayInputs, (input, index) => {
      input = arrayInputs[index];
      index = selectable === undefined ? index : parseInt(selectable[index], 10);

      input.checked = false;
      removeClass(tbody.rows[index], 'checked');
    });

    this.selectedData.clear();
  }

  /**
   *
   * all selectable checkbox
   */
  checkOnlySelectable() {
    const {arrayInputs, tbody, selectable} = this.checkedConstant();
    let rows = this.isRowSelectable();

    this.uncheckAll();

    arrayEach(arrayInputs, (input, index) => {
      input = arrayInputs[index];
      index = selectable === undefined ? index : parseInt(selectable[index], 10);

      for (let j = 0; j < rows.length; j += 1) {
        if (index === rows[j]) {
          input.checked = true;
          addClass(tbody.rows[index], 'checked');

          if (!(this.selectedData.has(tbody.rows[index])) && !((this.settings.selectHiddenRows) && (this.hiddenRowsPlugin.isHidden(index)))) {
            this.addSelectedData(tbody.rows, index, tbody.rows[index].rowIndex - 1);
          }
          if ((this.settings.selectHiddenColumns) && (this.hiddenColumnsPlugin.hiddenColumns.length)) {
            this.checkIfHidden(tbody.rows, index);
          }
        }
      }
    });
    this.getSelectedValues();
  }

  /**
   *
   * all selected checkbox
   */
  checkSelectedRows() {
    const {arrayInputs, tbody, selectable} = this.checkedConstant();
    const selected = this.settings.selectedRows;

    arrayEach(arrayInputs, (input, index) => {
      input = arrayInputs[index];
      index = selectable === undefined ? index : parseInt(selectable[index], 10);

      for (let j = 0; j < selected.length; j += 1) {
        if (index === selected[j]) {
          input.checked = true;
          addClass(tbody.rows[index], 'checked');

          if (!(this.selectedData.has(tbody.rows[index])) && !((this.settings.selectHiddenRows) && (this.hiddenRowsPlugin.isHidden(index)))) {
            this.addSelectedData(tbody.rows, index, tbody.rows[index].rowIndex - 1);
          }
          if ((this.settings.selectHiddenColumns) && (this.hiddenColumnsPlugin.hiddenColumns.length)) {
            this.checkIfHidden(tbody.rows, index);
          }
        }
      }
    });
    this.getSelectedValues();
  }

  /**
   * Return selected values
   *
   */
  getSelectedValues() {
    return [...this.selectedData.values()];
  }

  /**
   * Return selected entries
   *
   */
  getSelectedEntries() {
    return [...this.selectedData.entries()];
  }

  /**
   * Insert checkbox in row header
   *
   * @private
   * @param {String} checkboxPosition Checkbox position, default -> null (replace row number)
   */
  insertRowHeaderCheckbox(checkboxPosition) {
    const rowHead = this.hot.rootElement.children[2].querySelectorAll('span.rowHeader');
    const arrayRows = Array.from(rowHead);
    let selectable = this.settings.selectableRows;
    let max = selectable === undefined ? arrayRows.length : selectable.length;

    for (let i = 0; i < max; i += 1) {
      let parent = selectable === undefined ? arrayRows[i].parentNode : arrayRows[selectable[i]].parentNode;

      switch (checkboxPosition) {
        case 'before':
          parent.insertAdjacentHTML('afterbegin', '<input class="checker" type="checkbox" autocomplete="off">');
          break;
        case 'after':
          parent.insertAdjacentHTML('beforeend', '<input class="checker" type="checkbox" autocomplete="off">');
          break;
        default:
          let input = this.createCheckbox();
          let child = selectable === undefined ? arrayRows[i] : arrayRows[selectable[i]];
          parent.replaceChild(input, child);
          break;
      }
    }
  }

  /**
   * change DOM listener.
   *
   * @private
   * @param {Event} event Click event.
   */
  clickCheckbox(event) {
    const src = event.target;
    const table = this.hot.table;
    let tr = src.parentNode.parentNode.parentNode;

    if (src.nodeName == 'INPUT' && src.className == 'checker') {
      if (src.checked) {
        addClass(table.rows[tr.rowIndex], 'checked');

        if (!(this.selectedData.has(table.rows[tr.rowIndex]))) {
          this.addSelectedData(table.rows, tr.rowIndex, tr.rowIndex - 1);
        }
        if ((this.settings.selectHiddenColumns) && (this.hiddenColumnsPlugin.hiddenColumns.length)) {
          const columnsCount = this.hot.countCols();
          const arr = [];
          let j = 0;

          while (j < columnsCount) {
            if (!(this.hiddenColumnsPlugin.isHidden(j))) {
              arr.push(this.hot.getDataAtCell(tr.rowIndex - 1, j));
            }
            j++;
          }
          this.selectedData.set(table.rows[tr.rowIndex], arr);
        }
      }
      if (!src.checked) {
        removeClass(table.rows[tr.rowIndex], 'checked');

        if (this.selectedData.has(table.rows[tr.rowIndex])) {
          this.selectedData.delete(table.rows[tr.rowIndex]);
        }
      }
    }
  }

  /**
   * Add selected data
   *
   * @private
   * @param {Node} node Node row
   * @param {Number} index Row index
   * @param {Node} row Node row
   */
  addSelectedData(node, index, row) {
    this.selectedData.set(node[index], this.hot.getDataAtRow(row));
  }

  /**
   * Check if given row AND/OR column is hidden.
   *
   * @private
   * @param {Node} tableRows Node row
   * @param {Number} index Given row number
   * @param {Number} columnCount Count all columns
   * @param {Array} arr Array init
   * @param {Number} j Needed while comparison
   */
  checkIfHidden(tableRows, index, columnsCount = this.hot.countCols(), arr = [], j = 0) {
    while (j < columnsCount) {
      if (!(this.hiddenColumnsPlugin.isHidden(j)) && !((this.settings.selectHiddenRows) && (this.hiddenRowsPlugin.isHidden(index)))) {
        arr.push(this.hot.getDataAtCell(index, j));
      }
      j++;
    }
    if (arr.length === 0) {
      return;
    }
    this.selectedData.set(tableRows[index], arr);
  }

  /**
   * Constant to checked action
   *
   * @private
   * @returns {Object}
   */
  checkedConstant() {
    const inputs = this.hot.rootElement.children[2].querySelectorAll('input.checker');

    return {
      arrayInputs: Array.from(inputs),
      tbody: this.hot.view.TBODY,
      selectable: this.settings.selectableRows
    };
  }

  /**
   * Create checkbox
   *
   * @private
   */
  createCheckbox() {
    const input = document.createElement('input');

    input.className = 'checker';
    input.type = 'checkbox';
    input.setAttribute('autocomplete', 'off');

    return input.cloneNode(false);
  }

  /**
   * De-assign all of your properties.
   */
  destroy() {
    super.destroy();
  }
}

export {RowSelection};

// Register plugin
registerPlugin('rowSelection', RowSelection);
