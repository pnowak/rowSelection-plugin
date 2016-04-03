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
 *  selectedRows: [2, 4, 6, 8, 10] or [[1, 5], 10]
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
     * Cached settings from Handsontable settings.
     *
     * @type {Object}
     */
    this.settings = {};
    /**
     * position input, 'after' 'before' or undefined (replace)
     *
     * @type {String}
     */
    this.inputPosition = void 0;
    /**
     * cherry-pick rows
     *
     * @type {Array}
     */
    this.selectedRows = void 0;
    /**
     * multiselect choice - true, false or Number
     *
     * @type {Boolean or Number}
     */
    this.multiselect = void 0;
    /**
     * helper count
     *
     * @type {Number}
     */
    this.completed = 0;
    /**
     *
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

    let settings = this.hot.getSettings().rowSelection; console.log(settings);

    if (typeof settings === 'object') {
      this.settings = settings;

      if (settings.selectedRows === undefined) {
        settings.selectedRows = this.settings.selectedRows;
      } else if (Array.isArray([...settings.selectedRows])) {
        let rows = [];
        for (let i = 0, len = settings.selectedRows.length; i < len; i += 1) {
          if (Array.isArray(settings.selectedRows[i])) {
            const [start, stop] = settings.selectedRows[i];
            for (let j = start; j <= stop; j += 1) {
              rows.push(j);
            }
          } else {
            rows.push(settings.selectedRows[i]);
          }
        }
        settings.selectedRows = rows;
      }

      if (typeof settings.inputPosition === 'undefined') {
        this.addHook('afterInit', () => this.insertRowHeaderInput());
      } else {
        this.addHook('afterInit', () => this.insertRowHeaderInput(settings.inputPosition));
      }

      if (settings.multiselect === true) {
        let rowsCount = this.addHook('afterInit', () => this.hot.countRows());
        settings.multiselect = rowsCount;
      } else if (settings.multiselect === false) {
        settings.multiselect = 1;
      }
    } else {
      this.addHook('afterInit', () => this.insertRowHeaderInput());
    }
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
   * The disablePlugin method is used to disable the plugin. Reset all of your classes properties to their default values here.
   */
  disablePlugin() {
    this.settings = void 0;
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
   * Insert checkbox in row header
   *
   * @param {String} input position, default -> replace row number
   */
  insertRowHeaderInput(inputPosition) {
    const rowHead = this.hot.rootElement.children[2].querySelectorAll('span.rowHeader');
    const arrayRows = Array.from(rowHead);
    let selected = this.settings.selectedRows;
    let max = selected === undefined ? arrayRows.length : selected.length;
    for (let i = 0; i < max; i += 1) {
      let parent = selected === undefined ? arrayRows[i].parentNode : arrayRows[selected[i] - 1].parentNode;
      switch (inputPosition) {
        case 'before':
          parent.insertAdjacentHTML('afterbegin', '<input class="checker" type="checkbox" autocomplete="off">');
          break;
        case 'after':
          parent.insertAdjacentHTML('beforeend', '<input class="checker" type="checkbox" autocomplete="off">');
          break;
        default:
          let input = this.createInput();
          let child = selected === undefined ? arrayRows[i] : arrayRows[selected[i] - 1];
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
    button.setAttribute('id', value);
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
      console.log([...this.selectedData.entries()]);
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
          this.clearAll();
          break;
        default:
          this.onlySelectable();
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
    const tbody = this.hot.view.TBODY;
    let selected = this.settings.selectedRows;
    for (let i = 0; i < arrayInputs.length; i += 1) {
      let index = selected === undefined ? i : parseInt(selected[i] - 1, 10);
      let input = arrayInputs[i];
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
    const tbody = this.hot.view.TBODY;
    let selected = this.settings.selectedRows;
    for (let i = 0; i < arrayInputs.length; i += 1) {
      let index = selected === undefined ? i : parseInt(selected[i] - 1, 10);
      let input = arrayInputs[i];
      input.checked = false;
      removeClass(tbody.rows[index], 'checked');
      tbody.rows[index].style.color = 'black';
    }
    this.selectedData.clear();
    this.completed = 0;
  }

  /**
   * click DOM listener.
   * check all selectable checkbox
   *
   * @private
   * @param {Event} event Click event.
   */
  onlySelectable() {
    return this.isRowSelectable('one one');
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
