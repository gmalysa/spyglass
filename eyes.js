/**
 * eyes.js - A value inspection tool with lots of features
 *
 * usage:
 *       var eyes = new require('eyes')
 *       console.log(eyes.inspect(somevar, 'somevar', options));
 */

require('colors');
var _ = require('underscore');

/**
 * Constructor for an inspection instance, this accepts a list of options,
 * which may overwrite the default options
 */
function eyes(options) {
	this.options = this.merge_opts(defaults, options);
}

/**
 * Merge option lists and combine certain nested properties
 * in a reasonable way. Accepts n arguments, combines all of
 * them and returns a single resulting options list. Combination
 * is applied in order from left to right with later options overwriting
 * earlier options
 */
function merge_opts() {
	var rtn = {'types' : {}, 'styles' : {}, 'hide' : {}, 'handlers' : {}};
	_.each(Array.prototype.slice.call(arguments), function(v, k) {
		if (v == undefined)
			return;

		_.extend(rtn, _.omit(v, ['styles', 'hide', 'types', 'handlers']));
		_.extend(rtn.styles, v.styles);
		_.extend(rtn.hide, v.hide);
		_.extend(rtn.types, v.types);
		_.extend(rtn.handlers, v.handlers);
	});
	return rtn;
};

/**
 * Applies the named style rule to the string and returns it. Allows for
 * multiple styles to be specified as an array, which will be applied each in turn
 */
function s(str, name, opts) {
	var style = opts.styles[name] || [];
	
	return _.reduce(style, function(memo, v) {
		return memo[v];
	}, str);
};

/**
 * typeof replacement from the original eyes, written in a more functional style,
 * identifies several built-in objects by class name rather than the most generic
 * option
 */
function type(val, opts) {
	var basetype = typeof val;
	var types = opts.types;

	// Only objects are subcategorized, the rest aren't
	if (basetype == 'object') {
		if (val === null)
			return 'null';
		
		// _.pairs converts {'object' : Object} into [['object', Object]]
		// so the 1st index is the function prototypes for instanceof
		// and the 0th index is the name we've assigned to that function
		var matches = _.filter(_.pairs(types), function(v) {
			return (val instanceof v[1]);
		});
		
		if (matches.length > 0)
			return _.last(matches)[0];
	}

	return basetype;
}

/**
 * Inspects an object and prints the result based on the stream option
 */
function inspect(obj, label, options) {
	if (arguments.length == 2) {
		if (typeof label == 'string' || label instanceof String) {
			options = {};
		}
		else {
			options = label;
			label = '';
		}
	}

	var opts = this.merge_opts(this.options, options);

	if (opts.stream) {
		opts.stream.write(this.analyze(obj, label, opts)+opts.nl);
	}
	else {
		return this.analyze(obj, label, opts);
	}
};

/**
 * Produces a string that describes the object, with the given label and
 * options. Note that opts have already had defaults applied and do not
 * need to be further modified
 */
function analyze(obj, label, opts) {
	return (label ? this.s(label+': ', 'label', opts) : '') + this.stringify(obj, 0, opts);
};

/**
 * Produces a string that describes the given object, using the display
 * options that have been selected. Tracks depth to avoid too deep recursion
 */
function stringify(obj, depth, opts) {
	var type = this.type(obj, opts);
	var str = opts.handlers[type].call(this, obj, type, depth, opts);
	return str;
};

/**
 * Handler for simple things that we can simply pass to s()
 */
function simple_handler(obj, type, depth, opts) {
	return this.s(obj+'', type, opts);
};

/**
 * Handler for null/undefined, just repeats the given type twice
 */
function type_handler(obj, type, depth, opts) {
	return this.s('['+type+']', type, opts);
};

/**
 * Handler for functions prints their names and argument counts
 */
function func_handler(obj, type, depth, opts) {
	if (obj.name && obj.name.length > 0)
		return this.s('[function '+obj.name+'('+obj.length+')]', type, opts);
	return this.s('[function (lambda)('+obj.length+')]', type, opts);
}

/**
 * Handler for strings that makes things printable nicely and shows
 * some hidden characters. Mostly taken from the original
 */
function string_handler(obj, type, depth, opts) {
	var str = obj.replace(/\\/g, '\\\\')
					.replace(/\n/g, '\\n')
					.replace(/\'/g, '\\\'')
					.replace(/[\u0001-\u001F]/g, function (m) {
						return '\\0' + m[0].charCodeAt(0).toString(8);
					});
	return this.s("'"+str+"'", type, opts);
}

/**
 * Handler for converting dates to a textual format, just calls the
 * right method
 */
function date_handler(obj, type, depth, opts) {
	return this.s(obj.toUTCString(), type, opts);
}

/**
 * Handler for converting regular expressions to their source
 */
function regex_handler(obj, type, depth, opts) {
	return this.s('/'+obj.source+'/', type, opts);
}

/**
 * Function for handling arrays, keeps track of depth and limits
 * recursion
 */
function array_handler(obj, type, depth, opts) {
	if (obj.length == 0) {
		return this.s('[]', 'symbol', opts);
	}

	if (depth >= opts.max_depth) {
		return this.s('[nested array]', 'array', opts);
	}

	var that = this;
	var strings = _.map(obj, function(v) {
		return that.stringify(v, depth+1, opts);
	});

	return this.pp_helper('[', ']', strings, depth, opts);
}

/**
 * Pretty printing helper function that joins together an array of
 * strings to display in a chunk. Opening and closing tokens may
 * be supplied in order to pretty print both arrays and objects
 * with the same function
 */
function pp_helper(open, close, strings, depth, opts) {
	var sep;
	var presep;
	var tlength = _.reduce(strings, function(memo, v) {
		// Include lengthe of default comma + space between identifiers
		return memo + strlen_nocc(v) + 2;
	}, 0);

	if (opts.pretty_print) {
		sep = opts.nl + new Array(depth+2).join(opts.indent);
		presep = sep;
	}
	else {
		sep = ' ';
		presep = '';
	}

	if (tlength > opts.max_itemlen) {
		return this.s(open, 'symbol', opts) + presep + strings.join(',' + sep) + this.s(close, 'symbol', opts);
	}
	else {
		return this.s(open, 'symbol', opts) + strings.join(', ') + this.s(close, 'symbol', opts);
	}
}

/**
 * Function for handling objects, keeps track of depth and limits
 * recursion. Also applies type matching rules. Note that a type
 * must be defined in the type array in order to pick it up in the
 * array of types to hide
 */
function object_handler(obj, type, depth, opts) {
	if (_.keys(obj).length == 0) {
		return this.s('{}', 'symbol', opts);
	}

	if (depth >= opts.max_depth) {
		return this.s('[nested object]', 'object', opts);
	}

	var master_list = _.pairs(obj);
	if (opts.hide.hidden) {
		_.each(Object.getOwnPropertyNames(obj), function(v) {
			if (obj.propertyIsEnumerable(v))
				return;
			master_list.push([v, obj[v]]);
		});
	}

	var that = this;
	var props = _.filter(master_list, function(v) {
		// Check all the types to hide
		if (_.contains(opts.hide.types, that.type(v[1], opts)))
			return false;
		
		// Check to skip by literal or regex match
		if (_.some(opts.skip, function(rule) {
			if (rule instanceof RegExp)
				return v[0].match(rule) !== null;
			return rule == v[0];
		})) {
			return false;
		}

		return true;
	});
	var strings = _.map(props, function(v) {
		return that.s(v[0], 'key', opts) + ' : ' + that.stringify(v[1], depth+1, opts);
	});

	return this.pp_helper('{', '}', strings, depth, opts);
}

/**
 * String length calculator that ignores control codes
 */
function strlen_nocc(str) {
	var res = str.match(/\u001b/g);
	if (res)
		return str.length - res.length*5;
	return str.length;
}

/**
 * Default style assignments, any valid value from colors can
 * be used here. Arrays are allowed to stack multiple modifiers
 */
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

/**
 * Default list of property names to skip
 */
var default_skip = [];

/**
 * Default settings for which special forms are omitted from an inspection output
 */
var default_hide = {
	'hidden'		: true,
	'types'			: ['function', 'undefined', 'null']
};

/**
 * Default list of object subtypes. You can specify additional object subtypes,
 * and they will be added to this list (but you can't remove elements from this
 * list)
 */
var default_subtypes = {
	'object'	: Object,
	'array'		: Array,
	'string'	: String,
	'regexp'	: RegExp,
	'number'	: Number,
	'boolean'	: Boolean,
	'date'		: Date
};

/**
 * Default handlers which are used to process each of the built-in recognized
 * variable types
 */
var default_handlers = {
	'string'	: string_handler,
	'number'	: simple_handler,
	'boolean'	: simple_handler,
	'date'		: date_handler,
	'null'		: type_handler,
	'undefined'	: type_handler,
	'regexp'	: regex_handler,
	'function'	: func_handler,
	'object'	: object_handler,
	'array'		: array_handler 
};

/**
 * Default settings object, any of these may be overridden
 * in a passed-in object.
 */
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

/**
 * Create class definitions from functions
 */
_.extend(eyes.prototype, {
	merge_opts		: merge_opts,
	s				: s,
	type			: type,
	inspect			: inspect,
	analyze			: analyze,
	stringify		: stringify,
	simple_handler	: simple_handler,
	type_handler	: type_handler,
	func_handler	: func_handler,
	date_handler	: date_handler,
	regex_handler	: regex_handler,
	array_handler	: array_handler,
	object_handler	: object_handler,
	pp_helper		: pp_helper
});

module.exports = eyes;
