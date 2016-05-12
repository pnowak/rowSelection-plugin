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
 * RowSelection: true
 * ...
 * // as a object
 * RowSelection: {
 *  checkboxPosition: 'after',
 *  selectableRows: [2, 4, 6, 8, 10] or [[1, 5], 10],
 *  selectHiddenRows: true,
 *  selectHiddenColumns: false
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
     * cherry-pick rows
     *
     * @type {Array}
     */
    this.selectableRows = void 0;
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
    return !!this.hot.getSettings().RowSelection;
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

    let settings = this.hot.getSettings().RowSelection;

    if (typeof settings === 'object') {
      this.settings = settings; console.log(settings);

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
        this.addHook('afterInit', () => this.insertRowHeaderInput());
      } else {
        this.addHook('afterInit', () => this.insertRowHeaderInput(settings.checkboxPosition));
      }

      if (typeof settings.isRowSelectable === 'function') {
        this.isRowSelectable = settings.isRowSelectable;
      }
    }
    if (settings === true) {
      this.addHook('afterInit', () => this.insertRowHeaderInput());
    }
    this.addHook('afterInit', () => this.createButton('Select all'));
    this.addHook('afterInit', () => this.createButton('Clear all'));
    this.addHook('afterInit', () => this.createButton('Only selectable'));

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
    this.eventManager.addEventListener(this.hot.rootElement, 'change', () => this.returnSelectedData());
    this.eventManager.addEventListener(this.hot.rootElement, 'click', (e) => this.clickButton(e));
    this.eventManager.addEventListener(this.hot.rootElement, 'click', () => this.returnSelectedData());
  }

  /**
   * Disable the plugin
   */
  disablePlugin() {
    this.settings = {};
    this.isHiddenColumnsPlugin = null;
    this.isHiddenRowsPlugin = null;
    this.selectedData.clear();

    super.disablePlugin();
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
   * Insert checkbox in row header
   *
   * @param {String} input position, default -> replace row number
   */
  insertRowHeaderInput(checkboxPosition) {
    const rowHead = this.hot.rootElement.children[2].querySelectorAll('span.rowHeader');
    const arrayRows = Array.from(rowHead);
    let selected = this.settings.selectableRows;
    let max = selected === undefined ? arrayRows.length : selected.length;

    for (let i = 0; i < max; i += 1) {
      let parent = selected === undefined ? arrayRows[i].parentNode : arrayRows[selected[i] - 1].parentNode;

      switch (checkboxPosition) {
        case 'before':
          parent.insertAdjacentHTML('afterbegin', '<input class="checker" type="checkbox" autocomplete="off">');
          break;
        case 'after':
          parent.insertAdjacentHTML('beforeend', '<input class="checker" type="checkbox" autocomplete="off">');
          break;
        default:
          let input = this.createCheckbox();
          let child = selected === undefined ? arrayRows[i] : arrayRows[selected[i] - 1];
          parent.replaceChild(input, child);
          break;
      }
    }
  }

  /**
   * Return selected data
   *
   */
  returnSelectedData() {
    console.log([...this.selectedData.values()]);
    return [...this.selectedData.values()];
  }

  /**
   * Add selected data
   *
   */
  addSelectedData(node, index, row) {
    this.selectedData.set(node[index], this.hot.getDataAtRow(row));
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
   * click DOM listener.
   *
   * @private
   * @param {Event} event Click event.
   */
  clickButton(event) {
    let src = event.target;
    if (src.nodeName === 'BUTTON' && src.className == 'button') {
      let value = src.textContent;
      switch (value) {
        case 'Select all':
          this.checkAll();
          break;
        case 'Clear all':
          this.uncheckAll();
          break;
        default:
          this.checkOnlySelectable();
      }
    }
  }

  /**
   * click DOM listener.
   * check all checkbox
   *
   * @private
   */
  checkAll() {
    const {arrayInputs, tbody, selected} = this.buttonConstant();

    arrayEach(arrayInputs, (input, index) => {
      input = arrayInputs[index];
      index = selected === undefined ? index : parseInt(selected[index] - 1, 10);

      input.checked = true;
      addClass(tbody.rows[index], 'checked');

      if (!(this.selectedData.has(tbody.rows[index])) && !((this.settings.selectHiddenRows) && (this.hiddenRowsPlugin.isHidden(index)))) {
        this.addSelectedData(tbody.rows, index, tbody.rows[index].rowIndex - 1);
      }
      if ((this.settings.selectHiddenColumns) && (this.hiddenColumnsPlugin.hiddenColumns.length)) {
        this.checkIfHidden(tbody.rows, index);
      }
    });
  }

  /**
   * click DOM listener.
   * uncheck all checkbox
   *
   * @private
   */
  uncheckAll() {
    const {arrayInputs, tbody, selected} = this.buttonConstant();

    arrayEach(arrayInputs, (input, index) => {
      input = arrayInputs[index];
      index = selected === undefined ? index : parseInt(selected[index] - 1, 10);

      input.checked = false;
      removeClass(tbody.rows[index], 'checked');
    });

    this.selectedData.clear();
  }

  /**
   * click DOM listener.
   * check all selectable checkbox
   *
   * @private
   */
  checkOnlySelectable() {
    const {arrayInputs, tbody, selected} = this.buttonConstant();
    let rows = this.isRowSelectable();

    this.uncheckAll();

    for (let i = 0; i < arrayInputs.length; i += 1) {
      let index = selected === undefined ? i : parseInt(selected[i] - 1, 10);
      let input = arrayInputs[i];

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
    }
  }

  /**
   * Check if given row AND/OR column is hidden.
   *
   * @private
   * @param {Node} node row
   * @param {Number} given row number
   * @param {Number} count all columns
   * @param {Array} array init
   * @param {Number} needed while comparison
   */
  checkIfHidden(tableRows, index, columnsCount = this.hot.countCols(), arr = [], j = 0) {
    while (j < columnsCount) {
      if (!(this.hiddenColumnsPlugin.isHidden(j)) && !(this.hiddenRowsPlugin.isHidden(index))) {
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
   * Constant to button action
   *
   * @private
   * @returns {Object}
   */
  buttonConstant() {
    const inputs = this.hot.rootElement.children[2].querySelectorAll('input.checker');

    return {
      arrayInputs: Array.from(inputs),
      tbody: this.hot.view.TBODY,
      selected: this.settings.selectableRows
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
   * Create button
   *
   * @private
   * @param {String} button label
   */
  createButton(value) {
    const button = document.createElement('button');
    const content = document.createTextNode(value);
    button.className = 'button';
    button.appendChild(content);
    this.hot.rootElement.appendChild(button);
  }

  /**
   * De-assign all of your properties.
   */
  destroy() {
    this.hiddenRowsPlugin = null;
    this.hiddenColumnsPlugin = null;
    super.destroy();
  }
}

export {RowSelection};

// Register plugin
registerPlugin('RowSelection', RowSelection);
