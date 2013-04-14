var util = require('util');
var gls = require('../glasses');
var glasses = new gls();

glasses.inspect({
    number: 42,
    string: "John Galt",
    regexp: /[a-z]+/,
    array: [99, 168, 'x', {}],
    func: function () {},
    bool: false,
    nil: null,
    undef: undefined,
    object: {attr: []}
}, "native types");

glasses.inspect({
    number: new(Number)(42),
    string: new(String)("John Galt"),
    regexp: new(RegExp)(/[a-z]+/),
    array: new(Array)(99, 168, 'x', {}),
    bool: new(Boolean)(false),
    object: new(Object)({attr: []}),
    date: new(Date)
}, "wrapped types");

var obj = {};
obj.that = { self: obj };
obj.self = obj;

glasses.inspect(obj, "circular object");
glasses.inspect({hello: 'moto'}, "small object");
glasses.inspect({hello: new(Array)(6) }, "big object");
glasses.inspect(["hello 'world'", 'hello "world"'], "quotes");
glasses.inspect({
    recommendations: [{
        id: 'a7a6576c2c822c8e2bd81a27e41437d8',
        key: [ 'spree', 3.764316258020699 ],
        value: {
            _id: 'a7a6576c2c822c8e2bd81a27e41437d8',
            _rev: '1-2e2d2f7fd858c4a5984bcf809d22ed98',
            type: 'domain',
            domain: 'spree',
            weight: 3.764316258020699,
            product_id: 30
        }
    }]
}, 'complex');

glasses.inspect([null], "null in array");

var nostream = new gls({stream: null});

util.puts(nostream.inspect('something', "something"));
util.puts(nostream.inspect("something else"));
