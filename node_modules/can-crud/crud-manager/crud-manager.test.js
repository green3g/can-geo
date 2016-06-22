import q from 'steal-qunit';
import can from 'can';

import { ViewModel } from './crud-manager';
import { ViewMap } from './ViewMap';
import { Connection, TaskMap } from '../../test/data/connection';
import { TOPICS } from './crud-manager';
import PubSub from 'pubsub-js';
let vm;

q.module('crud-manager.ViewModel', {
  beforeEach: () => {
    vm = new ViewModel();
  },
  afterEach: () => {
    vm = null;
    PubSub.clearAllSubscriptions();
  }
});

test('totalPages get()', assert => {
  let cases = [{
    items: 99,
    perPage: 10,
    expected: 10
  }, {
    items: 100,
    perPage: 10,
    expected: 10
  }, {
    items: 101,
    perPage: 10,
    expected: 11
  }];
  cases.forEach(c => {
    vm.attr({
      view: {
        connectionProperties: {
          totalItems: c.items
        }
      },
      queryPerPage: c.perPage
    });
    assert.equal(vm.attr('totalPages'), c.expected, 'totalPages should be calculated correctly');
  });
});

test('showPaginate get()', assert => {
  vm.attr({
    view: {
      connectionProperties: {
        totalItems: 10
      }
    }
  });
  vm.attr('parameters.perPage', 25);
  assert.equal(vm.attr('showPaginate'), false, 'pagination should not be shown with one page');

  vm.attr({
    view: {
      connectionProperties: {
        totalItems: 10
      }
    }
  });
  vm.attr('parameters.perPage', 5);
  assert.equal(vm.attr('showPaginate'), true, 'pagination should be shown with more than one page');
});

test('objects get()', assert => {
  let done = assert.async();
  vm.attr('view', { connection: Connection });
  vm.attr('objects').then(data => {
    assert.ok(data.length, 'data should be retrieved correctly');
    done();
  });
});

test('focusObject get()', assert => {
  let done = assert.async();
  vm.attr({
    view: {
      connection: Connection
    },
    viewId: 11
  });
  vm.attr('focusObject').then(data => {
    assert.equal(data.attr('id'), 11, 'data should be retrieved correctly');
    done();
  });

});

test('buttons get()', assert => {
  assert.equal(vm.attr('buttons').length, 3, 'buttons should be edit buttons');
  vm.attr('view', {
    disableEdit: true
  });

  assert.equal(vm.attr('buttons').length, 1, 'buttons should be default buttons');
});

test('_fields get()', assert => {
  vm.attr('view', {
    objectTemplate: TaskMap
  });
  assert.equal(vm.attr('_fields').length, 3, 'if no fields exist on the view, they should be created from the objectTemplate');

  vm.attr('view', {
    fields: ['test1', 'test2', 'test3', 'test4']
  });
  assert.equal(vm.attr('_fields').length, 4, 'if fields do exist on the view, they should be created correctly');
});

test('init() with parameters', assert => {
  vm = new ViewModel({
    view: {
      parameters: {test: 'text'}
    }
  });
  assert.equal(vm.attr('parameters.test'), 'text','parameters should be mixed in');

  vm = new ViewModel({
    relatedField: 'test',
    relatedValue: 'testVal'
  });
  assert.equal(vm.attr('parameters.filters.length'), 1, 'should create filters parameter when initialized with related field and value');
});

test('editObject(scope, dom, event, obj)', assert => {
  let done = assert.async();
  let id = 11;
  let obj = Connection.get({ id: id }).then(obj => {
    vm.attr('view', {
      connection: Connection
    });
    vm.editObject(null, null, null, obj);
    assert.equal(vm.attr('viewId'), 11, 'viewId should be set correctly');
    assert.equal(vm.attr('page'), 'edit', 'edit page should be displayed');
    done();
  });
});

test('viewObject(scope, dom, event, obj)', assert => {
  let done = assert.async();
  let id = 11;
  let def = Connection.get({ id: id });
  def.then(obj => {
    vm.attr('view', {
      connection: Connection
    });
    vm.viewObject(null, null, null, obj);
    assert.equal(vm.attr('viewId'), 11, 'viewId should be set correctly');
    assert.equal(vm.attr('page'), 'details', 'details page should be displayed');
    done();
  });
});

test('saveObject(scope, dom, event, obj) success', assert => {
  let done = assert.async(4);
  let view = new ViewMap({
    connection: Connection
  });
  let token = PubSub.subscribe(TOPICS.ADD_MESSAGE, (name, message) => {
    assert.ok(message.attr('message'), 'message should be published');
    done();
  });

  let id = 11;
  let obj = Connection.get({ id: id }).then(obj => {
    vm.attr('view', view);

    let def = vm.saveObject(null, null, null, obj);
    def.then(result => {
      assert.ok(result, 'deferred should be resolved');
      done();
    });
  });

  id = 999;
  vm.attr('view', view);

  let def = vm.saveObject(null, null, null, new can.Map({ id: id }));
  def.fail(result => {
    assert.ok(result, 'deferred should be resolved');
    done();
  });
});

test('setPage(page)', assert => {
  vm.attr({
    'page': 'edit',
    viewId: 999
  });

  vm.setPage('all');
  assert.equal(vm.attr('page'), 'all', 'page should be set correctly');
  assert.equal(vm.attr('viewId'), 0, 'viewId should be reset');
});

test('getNewObject()', assert => {
  vm.attr('view', {
    objectTemplate: TaskMap
  });
  assert.deepEqual(vm.getNewObject().attr(), new TaskMap().attr(), 'new object should be created');
});

test('deleteObjects(scope, dom, event, obj, skipConfirm)', assert => {
  let done = assert.async(4);
  let view = new ViewMap({
    connection: Connection
  });
  let token = PubSub.subscribe(TOPICS.ADD_MESSAGE, (name, message) => {
    assert.ok(message.attr('message'), 'message should be published');
    done();
  });

  let id = 11;
  vm.attr('view', view);

  //delete the object skip confirm
  let def = vm.deleteObject(null, null, null, new can.Map({ id: id }), true);
  def.then(result => {
    assert.ok(result, 'deferred should be resolved');
    done();
  });

  id = 99;
  vm.attr('view', view);

  //delete the object skip confirm
  def = vm.deleteObject(null, null, null, new can.Map({ id: id }), true);
  def.fail(result => {
    assert.ok(result, 'deferred should be resolved');
    done();
  });
});

test('deleteMmultiple()', assert => {
  let done = assert.async(4);
  let view = new ViewMap({
    connection: Connection
  });
  let token = PubSub.subscribe(TOPICS.ADD_MESSAGE, (name, message) => {
    assert.ok(message.attr('message'), 'message should be published');
    done();
  });

  let id = 11;
  vm.attr({
    view: view,
    selectedObjects: new can.List([new can.Map({
      id: 11
    }), new can.Map({
      id: 1
    })])
  });
  let d = vm.deleteMultiple(true);
  d.forEach(def => {
    def.then(r => {
      assert.ok(r, 'deferred should be resolved');
      done();
    });
  });
});

test('toggleFilter(val)', assert => {
  vm.toggleFilter();
  assert.ok(vm.attr('filterVisible'), 'filter should be visible after toggling');

  vm.toggleFilter();
  assert.notOk(vm.attr('filterVisible'), 'filter should not be visible after toggling again');

  vm.toggleFilter(false);
  assert.notOk(vm.attr('filterVisible'), 'filter should not be visible after toggling to false');
});

test('getRelatedValue(foreignKey, focusObject)', assert => {
  let map = new can.Map({
    test: 'testValue'
  });
  assert.equal(vm.getRelatedValue('test', map), 'testValue', 'related value should be returned');
});
