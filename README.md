# glasses

A value inspection tool with lots of features, based on eyes.js

## Overview

Initially, this started as a simple fork of the existing eyes.js library -- I wanted to modify the behavior
in a few places. However, I opted to rewrite the entire package in order to make it easier for me to work with
and introduce new features.

This package is intended as a replacement for utils.inspect() to offer additional functionality and customizability.
It provides color-based output using the established `colors` package. Custom display routines can be added for objects
of any type, and the existing routines for handling builtins can be replaced with user-defined methods. Fields may
be omitted from the output based on type, exact name match, or regular expression name match.

The output may be displayed in optional pretty-printed format or in a compact one-line format.

## Using glasses

Include the module and create an instance of the inspection object

```javascript
var gls = require('glasses');
gls = new gls();
```

The constructor accepts an optional options argument that can modify any of the built-in settings. These options are
explained below.

To inspect an object `foo` and print to stdout (the default):

```javascript
foo = {'a' : 'b'};
gls.inspect(foo);
```

produces (but with colors...)

```javascript
{a : 'b'}
```

To add a name label to prepend to the output, add it as the second parameter. A colon will be added automatically.

```javascript
gls.inspect(foo, 'Foo');

Foo: {a : 'b'}
```

The third parameter can be used to specify options, but they can also be passed in place of the label if one isn't
required.

```javascript
gls.inspect(foo, 'Foo', {'skip' : ['a']});
    
Foo: {}
```

## Options

I've made an effort to select a sensible set of default options, including a color scheme chosen to match the
default look of util.inspect(). However, you may wish to change some or all of the parameters. The complete list
of options is:

```javascript
var defaults = {
    'styles'		: default_styles,
    'skip'			: default_skip,
    'hide'			: default_hide,
    'types'			: default_subtypes,
    'handlers'		: default_handlers,
    'pretty_print'	: true,
    'stream'		: process.stdout,
    'max_itemlen'	: 40,
    'max_depth'		: 5,
    'indent'		: '   ',
    'nl'			: "\n"
};
```

The simple options can be described easily. `pretty_print` controls the use of pretty printing for output formatting.
`stream` should be set to the stream object used for output. By default, this is stdout. Setting `stream` to null will
cause `gls.inspect()` to return the formatted string rather than printing it. `max_itemlen` is the maximum string length
for one array or object as printed before it is broken into multiple lines when pretty printing. `max_depth` is the
maximum depth that `gls.inspect()` will recursively print out. `indent` is a string used to indent the output. Finally,
`nl` is the string that should be used for a newline (note: this doesn't actually have to have a newline if you want to
format things differnetly.

The fields `styles`, `skip`, `hide`, `handlers`, and `types` are more complicated, and each has its own set of defaults.

`styles` controls the color styles that are applied to variables based on their data types. The default values for
`styles` are listed here:

```javascript
var default_styles = {
    'label'		: ['bold'],
    'key'		: ['bold'],
    'symbol'	: ['bold', 'blue'],
    'object'	: ['blue'],
    'array'		: ['blue'],
    'function'	: ['cyan'],
    'string'	: ['green'],
    'number'	: ['yellow'],
    'boolean'	: ['yellow'],
    'regexp'	: ['red'],
    'date'		: ['magenta'],
    'null'		: ['grey'],
    'undefined'	: ['grey']
};
```

The first three, `label`, `key`, and `symbol` are special names used when printing labels, object keys, and {} or []
symbols. The rest of the styles are used to match data types as defined in the `types` field. Note that each style is
an array. This is because styles can chain multiple effects (which is used by `symbol` by default). The default list
of types is simply the javascript built in objects:

```javascript
var default_subtypes = {
    'object'	: Object,
    'array'		: Array,
    'string'	: String,
    'regexp'	: RegExp,
    'number'	: Number,
    'boolean'	: Boolean,
    'date'		: Date
};
```

For the types object, the key should be the "name" of that type to be used to refer to it everywhere, and the value
should be suitable for use with `instanceof` to determine whether the object was constructed as an instance of a given
prototype.

`hide` is used to control which fields are hidden. It is an object with two possible keys: `hidden` which controls
whether or not non-enumerable properties are printed. A value of true will print non-enumerable properties. The other
key is `types` which is an array of value types to omit when printing an object. For example, the default `hide` value
is:

```javascript
var default_hide = {
    'hidden'		: true,
    'types'			: ['function', 'undefined', 'null']
};
```

This will print non-enumerable properties, and it will not print any fields whose values resolve to function, undefined,
or null types. You may specify custom types here so long as they are also added to the `types` field in the general
properties.

The `handlers` field maps from type values to callback functions that are used to determine the display for a given
object type. Each handler should have the following declaration:

```javascript
function handler(object, type, depth, opts)
```

The context for each handler will be set to the glasses instance that is currently inspecting an object. This permits
handlers to make calls to internal functions such as `s()` very easily. If a handler will make recursive calls to
`stringify()`, it should be sure to respect the depth argument and limit recursion, as the recursive limit must be
applied within the handler itself in order to format the output meaningfully when it is reached (and allow the most
flexibility when formatting).

The handler should return a string, in all cases, representing the object that it was given. If a handler is registered
for only one type, then the type argument can effectively be ignored, as it will always match. Sometimes, like in the
case of `simple_handler()`, it is advantageous to handle multiple types with one handler, and the type value can then
be forwarded to `s()` or used internally to differentiate between all possible types.

Finally, the `skip` option defaults to an empty array. Entries in `skip` can be strings or regular expressions, and they
will be matched against object keys during property enumeration to eliminate unwanted keys. A possible skip array,
therefore, could be

```javascript
    [/^_/, 'id']
```

to hide all fields that begin with an underscore, as well as any field whose name is exactly id.

When specifying options for any of these compound types, the original types are not lost. Internally, the options are
combined using _.extend(); this is applied specially for all fields except `skip`, which will be overrwitten by a given
array (`skip` is empty by default, so this isn't a big deal). Therefore, you do not (and really, should not) include
the default values when augmenting one of the compound types with custom logic. Any matching fields will be overwritten
with your values, and any new keys that you are adding will be added to the options array for the duration of the call
to `inspect()`.

The options object passed to `gls.inspect()` is the same as that passed to the constructor. Therefore, you can construct
a glasses object that has your preferred settings stored as a default by simply passing your options to the constructor
rather than waiting until you call `gls.inspect()`.

## Examples

A few more examples to illustrate how custom options can be passed in to `gls.inspect()`.

TODO.
