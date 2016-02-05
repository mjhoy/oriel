var noop = function () {};
var _test = noop;

function present(sel) {
  ok($(sel)[0], "expected selector `" + sel + "` to be present.");
}

function absent(sel) {
  ok(!$(sel)[0], "expected selector `" + sel + "` to be absent.");
}

module("indexesOfNeighbors");

test("indexesOfNeighbors", function() {
  var indexesOfNeighbors = Oriel.indexesOfNeighbors;

  deepEqual(indexesOfNeighbors(1, 2, 10),
            [ 9, 0, 1, 2, 3 ]);
  deepEqual(indexesOfNeighbors(5, 1, 10),
            [ 4, 5, 6 ]);
  deepEqual(indexesOfNeighbors(2, 1, 3),
            [ 1, 2, 0 ]);
  deepEqual(indexesOfNeighbors(2, 4, 14),
            [ 12, 13, 0, 1, 2, 3, 4, 5, 6 ]);
});

module("constructor");

test("Oriel constructor throws if no selector", function() {

  throws(
    function () {
      new Oriel();
    },
    "throws without selector given"
  );

  ok(new Oriel('#empty-div'),
     "doesn't throw with selector given");

  ok(new (Oriel.extend({selector: '#empty-div'}))(),
     "doesn't throw with selector given as subclassed prop");

});

test("Oriel constructor initializes object", function() {

  var TestClass = Oriel.extend({
    init: function() { this.initWasCalled = true; }
  });

  var o = new TestClass('#empty-div');
  ok(o.initWasCalled, "calls the init() method");
  equal(o.items.length, 0,
        "initializes the items array");
  equal(o.thumbs.length, 0,
        "initializes the thumbs array");
  equal(o.captions.length, 0,
        "initializes the captions array");
  equal(o.originalElements.length, 0,
        "initializes the originalElements array");
  equal(o.selector, "#empty-div", "initializes the selector");
  equal(o.el[0], $('#empty-div')[0], "initializes the el");

});

module("Oriel.create");

test("equivalent to new ... extend", function() {
  var o1 = Oriel.create({ selector: '#empty-div' });
  var o2 = new (Oriel.extend({ selector: '#empty-div' }))();

  deepEqual(o1.prototype, o2.prototype);
});

module(".init");

test("calls setupDom, analyze, and set", function () {
  var TestClass = Oriel.extend({
    _calls: [],
    setupDom: function() { this._calls.push("setupDom"); },
    analyze: function() { this._calls.push("analyze"); },
    set: function(i) { this._calls.push("set " + i); },
  });

  var o = new TestClass('#empty-div');
  deepEqual(["setupDom", "analyze", "set 0"], o._calls);
});

module(".setUpDom");

var TestSetUpDom = Oriel.extend({
  analyze: noop,
  set: noop,
});

test("adds oriel class", function() {
  var o = new Oriel('#empty-div');
  ok($('#empty-div').hasClass('oriel'),
     "adds the oriel dom class to the element");
});

test("adds oriel divs", function() {
  var o = new TestSetUpDom('#a-list');
  ok($('#a-list > .oriel-wrapper > .oriel-stage > .oriel-placeholder')[0],
     "placeholder div");
  ok($('#a-list > .oriel-source > li')[1],
     "keeps source");
});

module(".statusSetup");

test("adds status", function () {
  var o = new TestSetUpDom('#a-list');
  var status = $('#a-list > .oriel-wrapper > .oriel-status');
  ok($('> .oriel-caption', status)[0],
     "caption div");
  var nav = $('> .oriel-navigation', status);
  ok($('> .oriel-prev-link', nav)[0],
     "navigation: previous");
  ok($('> .oriel-location', nav)[0],
     "navigation: location");
  ok($('> .oriel-next-link', nav)[0],
     "navigation: next");
});

test("override", function () {
  var TestClass = Oriel.extend({
    statusSetup: function() {
      $(this.el).prepend("<div class='foo'></div>");
    }
  });

  var o = new TestClass('#a-list');
  ok($('#a-list > .foo')[0],
     "adds the foo div");
  ok(!$('#a-list .oriel-status')[0],
     "does not add the standard status");
});

module(".handlerSetup");

test("sets up next and previous", function () {

  var _calledNext = false;
  var _calledPrev = false;

  var TestClass = Oriel.extend({
    next: function() { _calledNext = true; },
    prev: function() { _calledPrev = true; }
  });

  var o = new TestClass('#empty-div');

  $('#empty-div .oriel-next-link').click();
  ok(_calledNext, "next handler set up");

  $('#empty-div .oriel-prev-link').click();
  ok(_calledPrev, "prev handler set up");
});

module(".analyze");

test("populates items, thumbs, captions, originalElements", function() {

  // this is the api that analyze uses
  var api = {
    el: $('#my-images-source'),
    itemSelector: 'li',
    buildItem: Oriel.prototype.buildItem,
    buildWrappedItem: Oriel.prototype.buildWrappedItem,
    getFull:    function(el) { return $('a', el).attr('href'); },
    getThumb:   function(el) { return $('img', el).attr('src'); },
    getCaption: function(el) { return $.trim($('a', el).text()); },
    items: [],
    fulls: [],
    thumbs: [],
    captions: [],
    originalElements: []
  };

  Oriel.prototype.analyze.apply(api);

  deepEqual(api.fulls,  ["img/1.jpg", "img/2.jpg"]);
  deepEqual(api.thumbs, ["img/1-thumb.jpg", "img/2-thumb.jpg"]);
  deepEqual(api.captions, ["My image 1", "My image 2"]);

  equal(2, api.items.length, "2 items");
  equal(2, api.originalElements.length, "2 original elements");

  // undefined elements
  api.getThumb = function(el) { return false; };

  Oriel.prototype.analyze.apply(api);
  deepEqual(api.thumbs, [undefined, undefined]);

  // getCaption default behavior
  api.getCaption = Oriel.prototype.getCaption;
  Oriel.prototype.analyze.apply(api);

  equal("Alternative caption data", api.captions[1]);
});

module(".set");

test("sets the current index and item", function() {
  var o = Oriel.create({
    selector: "#my-images",
    getFull: function(el) { return el.find('a').attr('href'); }
  });
  equal(o.currentIndex, 0, "starts at 0");
  ok(o.currentItem.find('img')[0]);
  o.set(1);
  equal(o.currentIndex, 1, "set changes currentIndex");
  equal(o.currentItem.find('img').attr('src'), "img/2.jpg");
});

test("sets the current item to the active dom item", function() {

  // what we should find is:
  // .oriel
  //   .oriel-wrapper
  //     .oriel-stage
  //       .oriel-placeholder
  //         .oriel-item.active
  //           [item]
  //         .oriel-item
  //           [item]
  //         .oriel-item
  //           [item]

  var o = Oriel.create({
    selector: "#my-images",
    getFull: function(el) { return $('a', el).attr('href'); }
  });

  // The first item should be set.
  present("#my-images > .oriel-wrapper > .oriel-stage > .oriel-placeholder > .oriel-item.oriel-active > img[src='img/1.jpg']");

  o.set(1);

  // The second item should now be set
  present("#my-images > .oriel-wrapper > .oriel-stage > .oriel-placeholder > .oriel-item.oriel-active > img[src='img/2.jpg']");
});

test("unsets active on other items", function() {

  var o = Oriel.create({
    selector: "#my-images",
    getFull: function(el) { return $('a', el).attr('href'); }
  });

  o.set(1);

  // the first item should NO LONGER be active

  absent("#my-images > .oriel-wrapper > .oriel-stage > .oriel-placeholder > .oriel-item.oriel-active > img[src='img/1.jpg']");

  o.set(0);

  // the second item should no longer be active
  absent("#my-images > .oriel-wrapper > .oriel-stage > .oriel-placeholder > .oriel-item.oriel-active > img[src='img/2.jpg']");
});

test("calls onItemChange if present", function() {
  var calls = [];

  var o = Oriel.create({
    selector: "#my-images",
    getFull: function(el) { return $('a', el).attr('href'); },
    onItemChange: function(el) {
      calls.push([ this.currentIndex, el.find('img').attr('src') ]);
    }
  });

  deepEqual([[0, 'img/1.jpg']], calls);
  o.set(1);
  deepEqual([[0, 'img/1.jpg'], [1, 'img/2.jpg']], calls);
});

test("calls updateStatus", function() {
  var calls = [];
  var o = Oriel.create({
    selector: "#my-images",
    getFull: function(el) { return $('a', el).attr('href'); },
    updateStatus: function() { calls.push(this.currentIndex); }
  });

  deepEqual([0], calls);
  o.set(1);
  deepEqual([0, 1], calls);
});

test("does not set anything if index out of range", function() {
  var o = Oriel.create({selector: "#my-images"});
  var currentItem = o.currentItem;
  o.set(-1);
  equal(currentItem, o.currentItem);
});

// helper for testing our preload/lazy load
var words = [
  "abarticular",
  "volitiency",
  "sylvicoline",
  "dodecastyle",
  "huddock",
  "acetacetic",
  "canalage",
  "Fagelia",
  "metatrophic"
];

var loaded = function(is) {
  var _i, _l;
  for(_i = 0, _l = is.length; _i < _l; _i++) {
    var word = words[is[_i]];
    present("#a-long-list .oriel-item:contains('"+word+"')");
  }
};

var notLoaded = function(is) {
  var _i, _l;
  for(_i = 0, _l = is.length; _i < _l; _i++) {
    var word = words[is[_i]];
    absent("#a-long-list .oriel-item:contains('"+word+"')");
  }
};

test("loads nearby neighbors", function() {
  var o = Oriel.create({
    selector: "#a-long-list",
    buildItem: function(el) {
      return $(el).text();
    },
    prefetch: 2
  });

  loaded([0,1,2,8,7]);
  notLoaded([3,4,5,6]);

  o.set(1);
  loaded([3]);
  notLoaded([4,5,6]);

  o.set(5);
  loaded([0,1,2,3,4,5,6,7,8]);
});

test("loads nearby neighbors: prefetch 3", function() {
  var o = Oriel.create({
    selector: "#a-long-list",
    buildItem: function(el) {
      return $(el).text();
    },
    prefetch: 3
  });

  loaded([0,1,2,3,8,7,6]);
  notLoaded([4,5]);

  o.set(1);
  loaded([4]);
  notLoaded([5]);

  o.set(5);
  loaded([0,1,2,3,4,5,6,7,8]);
});

module("load");

test("calls onItemLoad", function() {

  var calls = [];

  var o = Oriel.create({
    selector: "#a-long-list",
    buildItem: function(el) {
      return $(el).text();
    },
    prefetch: 2,
    onItemLoad: function(el, index) { calls.push([index, $.trim(el.text())]); }
  });

  deepEqual(calls,
            [
              [0, "abarticular"],
              [7, "Fagelia"],
              [8, "metatrophic"],
              [1, "volitiency"],
              [2, "sylvicoline"]
            ]);
  calls = [];
  o.set(1);
  deepEqual(calls,
            [
              [3, "dodecastyle"]
            ]);
});

test("sets onItemClick", function() {

  var calls = [];

  var o = Oriel.create({
    selector: "#a-long-list",
    buildItem: function(el) {
      return $(el).text();
    },
    prefetch: 2,
    onItemClick: function(el, e) {
      calls.push([this.currentIndex, $.trim(el.text())]);
    }
  });

  o.set(0);
  $('#a-long-list .oriel-active').click();
  deepEqual(calls,
            [
              [0, "abarticular"],
            ]);
  calls = [];
  o.set(3);
  $('#a-long-list .oriel-active').click();
  deepEqual(calls,
            [
              [3, "dodecastyle"]
            ]);
});

module("next and prev");

test("work as expected", function() {
  var o = Oriel.create({
    selector: "#a-long-list"
  });

  equal(0, o.currentIndex);
  o.next();
  equal(1, o.currentIndex);
  o.prev();
  equal(0, o.currentIndex);
  o.prev();
  equal(8, o.currentIndex);
  o.next();
  equal(0, o.currentIndex);
});

test("no allow loop", function() {
  var o = Oriel.create({
    selector: "#a-long-list",
    allowLoop: false
  });

  equal(0, o.currentIndex);
  o.next();
  equal(1, o.currentIndex);
  o.prev();
  equal(0, o.currentIndex);
  o.prev();
  equal(0, o.currentIndex);
  o.set(8);
  o.next();
  equal(8, o.currentIndex);
});

module("setCaption");

test("sets the caption div", function() {
  var o = Oriel.create({
    selector: '#my-images',
    getCaption: function(el) { return el.text(); }
  });

  present("#my-images .oriel-caption:contains('My image 1')");

  o.set(1);
  present("#my-images .oriel-caption:contains('My image 2')");
});

test("custom setCaption function", function() {
  calls = [];
  var o = Oriel.create({
    selector: '#my-images',
    getCaption: function(el) { return $.trim(el.text()); },
    setCaption: function(c, i) { calls.push([c, i]); }
  });

  deepEqual(calls, [["My image 1", 0]]);

  calls = [];
  o.set(1);
  deepEqual(calls, [["My image 2", 1]]);
});

module("setLocation");

test("sets the location", function() {
  var o = Oriel.create({
    selector: "#a-long-list"
  });

  present("#a-long-list .oriel-location:contains('1 of 9')");
  o.next();
  present("#a-long-list .oriel-location:contains('2 of 9')");
});

test("custom setLocation function", function() {
  calls = [];

  var o = Oriel.create({
    selector: "#a-long-list",
    setLocation: function(i) { calls.push(i); }
  });
  deepEqual(calls, [0]);
  o.next();
  deepEqual(calls, [0,1]);
});

module("plugins");

test("is not instantiated without option set", function() {
  Oriel.register_plugin({
    name: "myPlugin",
    foo: "bar"
  });
  var o = Oriel.create({
    selector: "#my-images"
  });
  ok(!o.plugins.myPlugin);
});

test("is instantiated with option set", function() {
  Oriel.register_plugin({
    name: "myPlugin",
    foo: "bar"
  });
  var o = Oriel.create({
    selector: "#my-images",
    plugins: { myPlugin: true }
  });

  ok(o.plugins.myPlugin);
  equal(o.plugins.myPlugin.foo, "bar");
});

test("hook methods", function() {
  var initCalls = [];
  var setCalls = [];

  Oriel.register_plugin({
    name: "myPlugin",
    foo: "bar",
    hooks: {
      init: function(oriel) {
        equal(this.foo, "bar");
        initCalls.push(["init called!", oriel.currentIndex]);
      },
      set: function(oriel) {
        setCalls.push(["set called!", oriel.currentIndex]);
      },
    }
  });

  var o = Oriel.create({
    selector: "#my-images",
    plugins: { myPlugin: true }
  });

  deepEqual(initCalls, [["init called!", undefined]]);
  deepEqual(setCalls, [["set called!", 0]]);

  o.set(1);
  deepEqual(setCalls,
            [["set called!", 0],
             ["set called!", 1]]);
});

module("class properties");

test("includes domClass and sel", function () {
  equal(Oriel.domClass.wrapper, "oriel-wrapper");
  equal(Oriel.sel.wrapper,     ".oriel-wrapper");
});
