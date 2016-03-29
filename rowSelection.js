import BasePlugin from './../_base';
import {registerPlugin, getPlugin} from './../../plugins';
import {addClass, hasClass, removeClass} from './../../helpers/dom/element';
import {EventManager} from './../../eventManager';

/**
 * @plugin rowSelection
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
 * // as a object with initial checkbox position
 * rowSelection: {
 *  inputPosition: 'after',
 *  selectedRows: [2, 4, 6, 8, 10],
 *  multiselect: true // true = all, false = 1, number = number
 * }
 *
 */
class rowSelection extends BasePlugin {

  // The argument passed to the constructor is the currently processed Handsontable instance object.
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
     * position input, 'after' 'before' or undefined (replace)
     *
     * @type {String}
     */
    this.inputPosition = '';

    /**
     * cherry-pick rows
     *
     * @type {Array}
     */
    this.selectedRows = null;

    /**
     * multiselect choice - true, false or Number
     *
     * @type {Boolean or Number}
     */
    this.multiselect = true;

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
   * The enablePlugin method is triggered on the beforeInit hook. It should contain your initial plugin setup, along with
   * the hook connections.
   * Note, that this method is run only if the statement in the isEnabled method is true.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }
    if (!this.eventManager) {
      this.eventManager = new EventManager(this);
    }

    // All plugin hooks.
    this.addHook('afterInit', () => this.modifyBySettings());
    this.addHook('afterUpdateSettings', () => this.onAfterUpdateSettings());
    this.addHook('afterInit', () => this.createButton('Select all'));
    this.addHook('afterInit', () => this.createButton('Clear all'));
    this.addHook('afterInit', () => this.createButton('Only selectable'));
    this.registerEvents();

    // The super method assigns the this.enabled property to true, which can be later used to check if plugin is already enabled.
    super.enablePlugin();
  }

  /**
   * Register all necessary DOM listeners.
   *
   * @private
   */
  registerEvents() {
    this.eventManager.addEventListener(this.hot.rootElement, 'change', (e) => this.clickInput(e));
    this.eventManager.addEventListener(this.hot.rootElement, 'click', (e) => this.clickButton(e));
  }

  /**
   * afterUpdateSettings callback.
   *
   * @private
   */
  onAfterUpdateSettings() {
    this.modifyBySettings();
  }

  modifyBySettings() {
    const selectSettings = this.hot.getSettings().rowSelection;
    let inputPosition = selectSettings.inputPosition;
    let selectedRows = selectSettings.selectedRows;
    let multiselect = selectSettings.multiselect;

    if (selectedRows === undefined) {
      this.selectedRows = selectedRows; console.log(this.selectedRows);
    } else {
      let rows = [];
      for (let i = 0, len = selectedRows.length; i < len; i += 1) {
        if (Array.isArray(selectedRows[i])) {
          let start = selectedRows[i][0];
          let stop = selectedRows[i][1];
          for (let j = start; j <= stop; j += 1) {
            rows.push(j);
          }
        } else {
          rows.push(selectedRows[i]);
        }
      }
      this.selectedRows = rows;
    }

    if (typeof inputPosition === 'undefined') {
      this.insertRowHeaderInput(null, selectedRows = this.selectedRows);
    } else {
      this.insertRowHeaderInput(inputPosition, selectedRows = this.selectedRows);
    }

    if (typeof multiselect === 'number') {
      this.multiselect = multiselect;
    }

    if (multiselect === true) {
      this.multiselect = this.hot.countRows();
    } else {
      this.multiselect = 1;
    }
  }

  /**
   * Insert checkbox in row header
   *
   * @param {String} input position, default -> replace row number
   * @param {Array} rows where input should be
   */
  insertRowHeaderInput(inputPosition, selectedRows) {
    const rowHead = this.hot.rootElement.children[2].querySelectorAll('span.rowHeader');
    const arrayRows = Array.from(rowHead);
    let len = selectedRows === undefined ? arrayRows.length : selectedRows.length;
    for (let i = 0; i < len; i += 1) {
      let parent = selectedRows === undefined ? arrayRows[i].parentNode : arrayRows[selectedRows[i] - 1].parentNode;
      switch (inputPosition) {
        case 'before':
          parent.insertAdjacentHTML('afterbegin', '<input class="checker" type="checkbox" autocomplete="off">');
          break;
        case 'after':
          parent.insertAdjacentHTML('beforeend', '<input class="checker" type="checkbox" autocomplete="off">');
          break;
        default:
          let input = this.createInput();
          let child = (arrayRows[selectedRows[i] - 1] || arrayRows[i]);
          parent.replaceChild(input, child);
          break;
      }
    }
  }

  /**
   * Create checkbox
   *
   * @private
   */
  createInput() {
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
   */
  createButton(value) {
    const button = document.createElement('button');
    const content = document.createTextNode(value);
    button.className = 'button';
    button.appendChild(content);
    this.hot.rootElement.appendChild(button);
  }

  /**
   * change DOM listener.
   *
   * @private
   * @param {Event} event Click event.
   */
  clickInput(event) {
    const src = event.target;
    const table = this.hot.table;
    let tr = src.parentNode.parentNode.parentNode;
    if (src.nodeName == 'INPUT' && src.className == 'checker') {
      if (src.checked) {
        addClass(table.rows[tr.rowIndex], 'checked');
        table.rows[tr.rowIndex].style.color = 'red';
        if (!(this.selectedData.has(table.rows[tr.rowIndex]))) {
          this.selectedData.set(table.rows[tr.rowIndex], this.hot.getDataAtRow(tr.rowIndex - 1));
        }
      }
      if (!src.checked) {
        removeClass(table.rows[tr.rowIndex], 'checked');
        table.rows[tr.rowIndex].style.color = 'black';
        if (this.selectedData.has(table.rows[tr.rowIndex])) {
          this.selectedData.delete(table.rows[tr.rowIndex]);
        }
      }
      let vals = [...this.selectedData.entries()];
      console.log(vals);
    }
  }

  /**
   * click DOM listener.
   *
   * @private
   * @param {Event} event Click event.
   */
  clickButton(event) {
    if (event.target.nodeName === 'BUTTON' && event.target.className == 'button') {
      let value = event.target.textContent;
      switch (value) {
        case 'Select all':
          this.checkAll();
          break;
        case 'Clear all':
          this.clearAll();
          break;
        default:
          console.log('Only selectable');
      }
    }
  }

  /**
   * click DOM listener.
   * check all checkbox
   *
   * @private
   * @param {Event} event Click event.
   */
  checkAll() {
    const inputs = this.hot.rootElement.children[2].querySelectorAll('input.checker');
    const arrayInputs = Array.from(inputs);
    const selected = this.selectedRows;
    const multiselect = this.multiselect;
    const tbody = this.hot.view.TBODY;
    for (let i = 0; i < arrayInputs.length; i += 1) {
      let input = arrayInputs[i];
      let index = selected === undefined ? i : parseInt(selected[i] - 1, 10);
      input.checked = true;
      addClass(tbody.rows[index], 'checked');
      tbody.rows[index].style.color = 'red';
      if (!(this.selectedData.has(tbody.rows[index]))) {
        this.selectedData.set(tbody.rows[index], this.hot.getDataAtRow(tbody.rows[index].rowIndex - 1));
      }
    }
    console.log([...this.selectedData.entries()]);
  }

  /**
   * click DOM listener.
   * uncheck all checkbox
   *
   * @private
   * @param {Event} event Click event.
   */
  clearAll() {
    const inputs = this.hot.rootElement.children[2].querySelectorAll('input.checker');
    const arrayInputs = Array.from(inputs);
    const selected = this.selectedRows;
    const tbody = this.hot.view.TBODY;
    for (let i = 0, len = arrayInputs.length; i < len; i += 1) {
      let input = arrayInputs[i];
      let index = selected === undefined ? i : parseInt(selected[i] - 1, 10);
      input.checked = false;
      removeClass(tbody.rows[index], 'checked');
      tbody.rows[index].style.color = 'black';
    }
    this.selectedData.clear();
  }

  /**
   * The disablePlugin method is used to disable the plugin. Reset all of your classes properties to their default values here.
   */
  disablePlugin() {
    this.selectedData.clear();
    // The super method takes care of clearing the hook connections and assigning the 'false' value to the 'this.enabled' property.
    super.disablePlugin();
  }

  /**
   * The updatePlugin method is called on the afterUpdateSettings hook (unless the updateSettings method turned the plugin off).
   * It should contain all the stuff your plugin needs to do to work properly after the Handsontable instance settings were modified.
   */
  updatePlugin() {

    // The updatePlugin method needs to contain all the code needed to properly re-enable the plugin. In most cases simply disabling and enabling the plugin should do the trick.
    this.disablePlugin();
    this.enablePlugin();

    super.updatePlugin();
  }

  /**
   * The destroy method should de-assign all of your properties.
   */
  destroy() {
    // The super method takes care of de-assigning the event callbacks, plugin hooks and clearing all the plugin properties.
    super.destroy();
  }
}

export {rowSelection};

// You need to register your plugin in order to use it within Handsontable.
registerPlugin('rowSelection', rowSelection);
