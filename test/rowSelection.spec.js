describe('rowSelection', function() {
  var id = 'testContainer';

  function getMultilineData(rows, cols) {
    var data = Handsontable.helper.createSpreadsheetData(rows, cols);

    // Column C
    data[0][2] += '\nline';
    data[1][2] += '\nline\nline';

    return data;
  }

  beforeEach(function() {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should have checked inputs in row header if call checkAll method', function() {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 10),
      rowHeaders: true,
      rowSelection: true,
      width: 500,
      height: 300
    });
    hot.getPlugin('rowSelection').checkAll();

    var trs = hot.view.wt.wtTable.TBODY.childNodes;

    expect(Handsontable.dom.hasClass(trs[0], 'checked')).toBe(true);
    expect(Handsontable.dom.hasClass(trs[9], 'checked')).toBe(true);
  });

  it('should not have checked inputs in row header if call uncheckAll method', function() {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 10),
      rowHeaders: true,
      rowSelection: true,
      width: 500,
      height: 300
    });
    hot.getPlugin('rowSelection').checkAll();
    hot.getPlugin('rowSelection').uncheckAll();

    var trs = hot.view.wt.wtTable.TBODY.childNodes;

    expect(Handsontable.dom.hasClass(trs[0], 'checked')).not.toBe(true);
    expect(Handsontable.dom.hasClass(trs[9], 'checked')).not.toBe(true);
  });

  it('should "rowHeaders" set as `true`', function() {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 10),
      rowSelection: true,
      rowHeaders: false,
      width: 500,
      height: 300
    });
    hot.getPlugin('rowSelection').checkAll();

    var trs = hot.view.wt.wtTable.TBODY.childNodes;

    expect(Handsontable.dom.hasClass(trs[0], 'checked')).not.toBe(true);
  });

  it('should add values after checked input in row header', function() {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 10),
      rowSelection: {
        selectableRows: [6]
      },
      rowHeaders: true,
      width: 500,
      height: 300
    });
    hot.getPlugin('rowSelection').checkAll();

    var values = hot.getPlugin('rowSelection').getSelectedValues();

    expect(values.join('')).toEqual('A6,B6,C6,D6,E6,F6,G6,H6,I6,J6');
  });

  it('should return to default state after call disablePlugin method', function() {
    var hot = handsontable({
      data: getMultilineData(10, 10),
      rowSelection: true,
      rowHeaders: true,
      width: 500,
      height: 300
    });
    hot.getPlugin('rowSelection').checkAll();

    hot.getPlugin('rowSelection').disablePlugin();

    var trs = hot.view.wt.wtTable.TBODY.childNodes;

    expect(Handsontable.dom.hasClass(trs[0], 'checked')).not.toBe(true);
    expect(Handsontable.dom.hasClass(trs[10], 'checked')).not.toBe(true);
  });

  it('should check input in row header after call enablePlugin method', function() {
    var hot = handsontable({
      data: getMultilineData(10, 10),
      rowSelection: true,
      rowHeaders: true,
      width: 500,
      height: 300
    });
    hot.getPlugin('rowSelection').disablePlugin();
    hot.getPlugin('rowSelection').enablePlugin();

    hot.getPlugin('rowSelection').checkAll();

    var trs = hot.view.wt.wtTable.TBODY.childNodes;

    expect(Handsontable.dom.hasClass(trs[0], 'checked')).toBe(true);
    expect(Handsontable.dom.hasClass(trs[10], 'checked')).toBe(true);
  });

  it('should update settings after call updateSettings method', function() {
    var hot = handsontable({
      data: getMultilineData(10, 10),
      rowSelection: {
        selectableRows: [6, 9]
      },
      rowHeaders: true,
      width: 500,
      height: 300
    });
    hot.updateSettings({ rowSelection: true });

    hot.getPlugin('rowSelection').checkAll();

    var map = hot.getPlugin('rowSelection').selectedData;

    expect(map.size).toEqual(10);
  });

  describe('hidden rows functionality', function() {
    it('should allow hidden rows, when "selectHiddenRows" property is set to `false`', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        rowSelection: {
          checkboxPosition: 'after',
          selectHiddenRows: false
        },
        rowHeaders: true,
        hiddenRows: {
          rows: [3, 4]
        },
        width: 500,
        height: 300
      });
      hot.getPlugin('rowSelection').checkAll();

      var map = hot.getPlugin('rowSelection').selectedData;

      expect(map.size).toEqual(10);
    });

    it('should skip hidden rows, when "selectHiddenRows" property is set to `true`', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        rowSelection: {
          checkboxPosition: 'after',
          selectHiddenRows: true
        },
        rowHeaders: true,
        hiddenRows: {
          rows: [3, 4]
        },
        width: 500,
        height: 300
      });
      hot.getPlugin('rowSelection').checkAll();

      var map = hot.getPlugin('rowSelection').selectedData;

      expect(map.size).toEqual(8);
    });
  });

  describe('hidden columns functionality', function() {
    it('should allow to copy hidden columns, when "selectHiddenColumns" property is set to `false`', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        rowSelection: {
          selectableRows: [1],
          selectHiddenColumns: false
        },
        rowHeaders: true,
        hiddenColumns: {
          columns: [3, 4]
        },
        width: 500,
        height: 300
      });
      hot.getPlugin('rowSelection').checkAll();

      var val = hot.getPlugin('rowSelection').getSelectedValues();

      expect(val[0].length).toEqual(10);
    });

    it('should skip hidden columns, when "selectHiddenColumns" property is set to `true`', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        rowSelection: {
          selectableRows: [1],
          selectHiddenColumns: true
        },
        rowHeaders: true,
        hiddenColumns: {
          columns: [3, 4]
        },
        width: 500,
        height: 300
      });
      hot.getPlugin('rowSelection').checkAll();

      var val = hot.getPlugin('rowSelection').getSelectedValues();

      expect(val[0].length).toEqual(8);
    });
  });
});
