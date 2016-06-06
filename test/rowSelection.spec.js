describe('RowSelection', function() {
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
      RowSelection: true,
      width: 500,
      height: 300
    });
    hot.getPlugin('RowSelection').checkAll();

    var trs = hot.view.wt.wtTable.TBODY.childNodes;

    expect(Handsontable.dom.hasClass(trs[0], 'checked')).toBe(true);
    expect(Handsontable.dom.hasClass(trs[9], 'checked')).toBe(true);
  });

  it('should not have checked inputs in row header if call uncheckAll method', function() {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 10),
      rowHeaders: true,
      RowSelection: true,
      width: 500,
      height: 300
    });
    hot.getPlugin('RowSelection').checkAll();
    hot.getPlugin('RowSelection').uncheckAll();

    var trs = hot.view.wt.wtTable.TBODY.childNodes;

    expect(Handsontable.dom.hasClass(trs[0], 'checked')).not.toBe(true);
    expect(Handsontable.dom.hasClass(trs[9], 'checked')).not.toBe(true);
  });

  it('should "rowHeaders" set as `true`', function() {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 10),
      RowSelection: true,
      rowHeaders: false,
      width: 500,
      height: 300
    });
    hot.getPlugin('RowSelection').checkAll();

    var trs = hot.view.wt.wtTable.TBODY.childNodes;

    expect(Handsontable.dom.hasClass(trs[0], 'checked')).not.toBe(true);
  });

  it('should return values after checked input in row header', function() {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 10),
      RowSelection: {
        selectableRows: [1, 8]
      },
      rowHeaders: true,
      width: 500,
      height: 300
    });
    hot.getPlugin('RowSelection').checkAll();

    var map = hot.getPlugin('RowSelection').selectedData;

    expect(map.size).toEqual(2);
  });

  it('should return only selectable values after call checkOnlySelectable method', function() {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 10),
      RowSelection: {
          selectableRows: [6]
      },
      rowHeaders: true,
      width: 500,
      height: 300
    });
    hot.getPlugin('RowSelection').checkOnlySelectable();

    var values = hot.getPlugin('RowSelection').getSelectedValues();

    expect(values).toEqual('A6 B6  C6  D6  E6  F6  G6  H6  I6  J6');
  });

  it('should return to default state after call disablePlugin method', function() {
    var hot = handsontable({
      data: getMultilineData(10, 10),
      RowSelection: true,
      rowHeaders: true,
      width: 500,
      height: 300
    });
    hot.getPlugin('RowSelection').checkAll();

    hot.getPlugin('rowSelection').disablePlugin();

    var trs = hot.view.wt.wtTable.TBODY.childNodes;

    expect(Handsontable.dom.hasClass(trs[0], 'checked')).not.toBe(true);
    expect(Handsontable.dom.hasClass(trs[10], 'checked')).not.toBe(true);
  });

  it('should check input in row header after call enablePlugin method', function() {
    var hot = handsontable({
      data: getMultilineData(10, 10),
      RowSelection: true,
      rowHeaders: true,
      width: 500,
      height: 300
    });
    hot.getPlugin('rowSelection').disablePlugin();
    hot.getPlugin('rowSelection').enablePlugin();

    hot.getPlugin('RowSelection').checkAll();

    var trs = hot.view.wt.wtTable.TBODY.childNodes;

    expect(Handsontable.dom.hasClass(trs[0], 'checked')).toBe(true);
    expect(Handsontable.dom.hasClass(trs[10], 'checked')).toBe(true);
  });

  it('should update settings after call updateSettings method', function() {
    var hot = handsontable({
      data: getMultilineData(10, 10),
      RowSelection: true,
      rowHeaders: true,
      width: 500,
      height: 300
    });
    hot.updateSettings({
      RowSelection: { selectableRows: [[6, 9]]}
    });


  });

  describe('hidden rows functionality', function() {
    it('should allow hidden rows, when "selectHiddenRows" property is set to `false`', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        RowSelection: {
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
      hot.getPlugin('RowSelection').checkAll();

      var map = hot.getPlugin('RowSelection').selectedData;

      expect(map.size).toEqual(10);
    });

    it('should skip hidden rows, when "selectHiddenRows" property is set to `true`', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        RowSelection: {
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
      hot.getPlugin('RowSelection').checkAll();

      var map = hot.getPlugin('RowSelection').selectedData;

      expect(map.size).toEqual(8);
    });
  });

  describe('hidden columns functionality', function() {
    it('should allow to copy hidden columns, when "selectHiddenColumns" property is set to `false`', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        RowSelection: {
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
      hot.getPlugin('RowSelection').checkAll();

      var val = hot.getPlugin('RowSelection').getSelectedValues();

      expect(val[0].length).toEqual(10);
    });

    it('should skip hidden columns, when "selectHiddenColumns" property is set to `true`', function() {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        RowSelection: {
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
      hot.getPlugin('RowSelection').checkAll();

      var val = hot.getPlugin('RowSelection').getSelectedValues();

      expect(val[0].length).toEqual(8);
    });
  });
});
