// You need to import the BasePlugin class in order to inherit from it.
import BasePlugin from './../_base';
import {registerPlugin, getPlugin} from './../../plugins';
import {addClass, hasClass, removeClass} from './../../helpers/dom/element';
import {EventManager} from './../../eventManager';

/**
 * @plugin rowSelection
 * Note: keep in mind, that Handsontable instance creates one instance of the plugin class.
 *
 * @description
 * Blank plugin template. It needs to inherit from the BasePlugin class.
 */
class rowSelection extends BasePlugin {

  // The argument passed to the constructor is the currently processed Handsontable instance object.
  constructor(hotInstance) {
    super(hotInstance);

    this.eventManager = null;

    // Initialize all your public properties in the class' constructor.
    /**
     * yourProperty description.
     *
     * @type {String}
     */
    this.inputPosition = null;

    this.multiselect = true ? this.maxRows : 1;
    this.maxRows = null;

    /**
     * anotherProperty description.
     * @type {Array}
     */
    this.selectedData = new Map(); console.log(this.hot.getSettings());
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

    // Add all your plugin hooks here. It's a good idea to make use of the arrow functions to keep the context consistent.
    this.addHook('afterInit', () => this.insertRowHeaderInput(this.inputPosition));
    this.addHook('afterInit', () => this.createButton('Select all'));
    this.addHook('afterInit', () => this.createButton('Clear all'));
    this.addHook('afterInit', () => this.createButton('Only selectable'));
    this.registerEvents();

    // The super method assigns the this.enabled property to true, which can be later used to check if plugin is already enabled.
    super.enablePlugin();
  }

  insertRowHeaderInput(inputPosition) {
    const rowHead = this.hot.rootElement.querySelectorAll('span.rowHeader');
    const arrayRows = Array.from(rowHead);
    for (let i = 0, len = arrayRows.length; i < len; i += 1) {
      let parent = arrayRows[i].parentNode;
      switch (inputPosition) {
        case 'before':
          parent.insertAdjacentHTML('afterbegin', '<input class="checker" type="checkbox" autocomplete="off">');
          break;
        case 'after':
          parent.insertAdjacentHTML('beforeend', '<input class="checker" type="checkbox" autocomplete="off">');
          break;
        default:
          let input = this.createInput();
          parent.replaceChild(input, arrayRows[i]);
          break;
      }
    }
  }

  createInput() {
    const input = document.createElement('input');
    input.className = 'checker';
    input.type = 'checkbox';
    input.setAttribute('autocomplete', 'off');

    return input.cloneNode(false);
  }

  createButton(value) {
    const button = document.createElement('button');
    const content = document.createTextNode(value);
    button.className = 'button';
    button.appendChild(content);
    this.hot.rootElement.appendChild(button);
  }

  registerEvents() {
    this.eventManager.addEventListener(this.hot.rootElement, 'change', (e) => this.clickInput(e));
    this.eventManager.addEventListener(this.hot.rootElement, 'click', (e) => this.clickButton(e));
  }

  clickInput(event) {
    const src = event.target;
    const table = this.hot.table;
    let tr = src.parentNode.parentNode.parentNode;
    let check = 0;
    const max = this.maxRows ? this.maxRows : this.hot.countRows();
    if (src.nodeName == 'INPUT' && src.className == 'checker') {
      if (src.checked) {
        check += 1; console.log(check);
        if ((check < max)) {
          addClass(table.rows[tr.rowIndex], 'checked');
          table.rows[tr.rowIndex].style.color = 'red';
          if (!(this.selectedData.has(table.rows[tr.rowIndex]))) {
            this.selectedData.set(table.rows[tr.rowIndex], this.hot.getDataAtRow(tr.rowIndex - 1));
          }
        }
      }
      if (!src.checked) {
        check -= 1;
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

  checkAll() {
    const inputs = this.hot.rootElement.children[2].querySelectorAll('input.checker');
    const arrayInputs = Array.from(inputs);
    const max = this.maxRows ? this.maxRows : arrayInputs.length;
    const tbody = this.hot.view.TBODY;
    for (let i = 0; i < max; i += 1) {
      let input = arrayInputs[i];
      input.checked = true;
      addClass(tbody.rows[i], 'checked');
      tbody.rows[i].style.color = 'red';
      if (!(this.selectedData.has(tbody.rows[i]))) {
        this.selectedData.set(tbody.rows[i], this.hot.getDataAtRow(tbody.rows[i].rowIndex - 1));
      }
    }
    let vals = [...this.selectedData.entries()];
    console.log(vals);
  }

  clearAll() {
    const inputs = this.hot.rootElement.children[2].querySelectorAll('input.checker');
    const arrayInputs = Array.from(inputs);
    const tbody = this.hot.view.TBODY;
    for (let i = 0, len = arrayInputs.length; i < len; i += 1) {
      let input = arrayInputs[i];
      input.checked = false;
      removeClass(tbody.rows[i], 'checked');
      tbody.rows[i].style.color = 'black';
    }
    this.selectedData.clear();
    console.log(this.selectedData);
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
   * The afterChange hook callback.
   *
   * @param {Array} changes Array of changes.
   * @param {String} source Describes the source of the change.
   */
  onAfterChange(changes, source) {
    // afterChange callback goes here.
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
