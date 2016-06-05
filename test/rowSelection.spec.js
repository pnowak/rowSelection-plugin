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

  it('should have checked inputs in rowHeaders if "RowSelection" is set as `true` and call checkAll method', function() {
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
  });

  it('should do nothing if "RowSelection" property is set as `true` and rowHeaders is set as `false`', function() {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 10),
      RowSelection: true,
      rowHeaders: false,
      width: 500,
      height: 300
    });
    hot.getPlugin('RowSelection').checkAll();
    var trs = hot.view.wt.wtTable.TBODY.childNodes;

    expect(Handsontable.dom.hasClass(trs[0], 'checked')).toBe(false);
  });

  it('should return values after checked input in rowHeaders', function() {
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
    var map = hot.getPlugin('RowSelection').selectedData.size;

    expect(map).toEqual(2);
  });
});
