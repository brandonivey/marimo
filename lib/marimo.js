// Object polyfills are from mozilla dev network
if (!Object.create) {
    Object.create = function (o) {
        if (arguments.length > 1) {
            throw new Error('Object.create implementation only accepts the first parameter.')
        }
        function F() {}
        F.prototype = o
        return new F()
    }
}

// "polyfill" for console
if (!window.console) {
    window.console = {
        log: function() {},
        info: function() {},
        error: function() {}
    }
}

var event_transport = {
    init: function() {
        this._emitter = {}
        smokesignals.convert(this._emitter)
        this._seen_events = {}

        return this
    },
    seen: function(evnt) {
        return this._seen_events[evnt] ? true : false
    },
    on: function(evnt, cb) {
        if (_.isArray(evnt)) {
            if (evnt.length === 1) {
                evnt = evnt.pop()
            }
            else {
                var self = this
                this.on(evnt.pop(), function() { self.on(evnt, cb) })
                return
            }
        }

        if (marimo.events.seen(evnt)) { return cb() }

        this._emitter.on.call(this._emitter, evnt, cb)

        return this
    },
    emit: function(evnt, data) {
        this._seen_events[evnt] = true
        this._emitter.emit(evnt, data)

        return this
    },
    off: function(evnt) {
        this._emitter.off(evnt)

        return this
    },
    once: function(evnt) {
        this._emitter.once(evnt)

        return this
    }
}

var marimo = {
    /* this namespace stores live widgets, an event_transport, a library of
       clonable/extendable widgets, and utility functions for use anywhere.
    */
    init: function init($) {
        /*  initialize marimo with some framework object. You must do this.
            Currently only jQuery is supported (sorry).
        */
        // TODO eliminate dependence on jQuery
        this.$ = $
        // live widgets on the page
        this.widgets = {}
        // event transport
        this.events = event_transport.init()
        // library of prototype widgets
        this.widgetlib = {}

        this.$(document).ready(function() { marimo.events.emit('documentready'); })

        return this
    },
    add_widget: function add_widget(widget_args) {
        /*  add a widget to marimo.widgets. widget_args is an object that
            contains data that will be fed to the resulting widget's .init().
            marimo will look for widget_prototype is a string that corresponds
            to an object in marimo.widgetlib. If this key does not exist marimo
            will fall back to base_widget (this is probably not what you want).
        */
        var widget_prototype = this.widgetlib[widget_args['widget_prototype']]
        if (!widget_prototype) {
            if (widget_args['widget_prototype']) {
              console.log('Could not find widget_protoype: ' + widget_args['widget_prototype'] + ', falling back to base_widget')
            }
            widget_prototype = this.widgetlib.base_widget
        }
        if (!widget_args.id) { widget_args.id = this.random_int() }
        var w = Object.create(widget_prototype)
        this.widgets[widget_args.id] = w
        this.widgets[widget_args.id].init(widget_args)

        return this.widgets[widget_args.id]
    },
    add_widgets: function add_widgets(widgets) {
        /* a simple wrapper around this.add_widget() */
        for (var key in widgets) {
            if (!widgets.hasOwnProperty(key)) continue
            this.add_widget(widgets[key])
        }
    },
    printf: function printf(str, args) {
        /* purely a convenience function.

           var formatted = marimo.printf('hello there %s are you %s', ['nate', 'blue'])
        */
        marimo.$.each(args, function(k, v) {
            str = str.replace('%s', v)
        })
        return str
    },
    extend: function extend(obj, ex) {
        /* given some existing object, clone it with Object.create() and add
           the new behavior described by the ex object.

           the new object is returned.

           var mywidget = marimo.extend(marimo.widgetlib.base_widget, {
               thing: function() { do_stuff() },
               ...
           }
        */
        return _.extend(Object.create(obj), ex)
    },
    random_int: function random_int(min, max) {
        min = min || 0
        max = max || 10000
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}


// everything except for core marimo functionality should be a plugin
// this method will be used to add them to marimo
// for now it will go here
marimo.register_module = function register_module (module) {
  // ifethe namespace is already used fail fast
  if (marimo[module.name]) {
    console.log('Failed to register module "' + module.name + '" because there is already a module of that name');
    return;
  };
  var mod = marimo[module.name] = Object.create(module);
  mod.init();
  for (widgetname in module.widgetlib){
    if (!mod.widgetlib.hasOwnProperty(widgetname)) continue
    if (marimo.widgetlib[widgetname]) {
      console.log('Failed to add widget "' + widgetname + '" from module "' + mod.name + '" because there is already a widget of that name');
      continue;
    }
    // in that case it's safe to add the module
    marimo.widgetlib[widgetname] = mod.widgetlib[widgetname];
  }
};


marimo.widgetlib.base_widget = {
    /* this widget doesn't do much. It is here to be extended. */
    init: function(data) {
        /* basic init function for widgets. sets this.id and the rest of the
           argument object to this.data
        */
        this.id = data.id
        this.data = data
        return this
    },
    update: function(data) {
        /* to be implemented */
    },
    render: function() {
        /* to be implemented */
    },
    // set up an event listener. such events will be later emitted by marimo.
    // check to see if designated event has already been emitted so we can fire
    // synchronously. Optionally pass a list of events; once all of them have
    // been fired the callback will be run.
    on: function(evnt, cb, context) {
        /* call cb given event evnt. Optionally pass a context for cb to be
           called within. context defaults to the current context.

           evnt can either be a string or an array. If it is an array, cb will
           be called once every event named in the array has fired at least
           once.
        */
        marimo.events.on(evnt, _.bind(cb, context || this))
    },
    emit: function(evnt, data) {
        /* emit an event into marimo's event pool this is a wrapper around
           marimo.event for now.
        */
        data = data || {}
        _.extend(data, {_sender:this.id})
        marimo.events.emit(evnt, data)
    },
    _onlist: function(evntlist, cb) {
        /* wait on multiple events to do something. this is NOT intended to be
           called. so don't call it. use .on(), and pass
           an array instead of a string. you've been warned.
        */
        if (evntlist.length > 0) {
            var evnt = evntlist.pop()
            var that = this
            this.on(evnt, function() { that._onlist(evntlist, cb)}, this)
        }
        else {
            cb()
        }
    },
    // map DOM events to selectors and functions
    domwire: function wire(mapping) {
        /* map DOM events to selectors and functions. This is essentially a 
           large wrapper around calls to marimo.$(selector).bind(event, cb)

           this.domwire([{
               selector: marimo.printf('#%s button:first', [this.id]),
               event: 'click',
               cb: this.make_request
           }, {
               selector: marimo.printf('#%s form', [this.id]),
               event: 'submit',
               cb: this.submit_form
           }])
        */
        var widget = this
        marimo.$.each(mapping, function(k,v) {
            marimo.$(v.selector).bind(v.event, function(e) {
                e.preventDefault()
                v.cb.call(widget, e)
            })
        })
    }
}

marimo.widgetlib.writecapture_widget = marimo.extend(marimo.widgetlib.base_widget, {
    /* a widget for handling html with potentially horrible javascript.
       sandboxes, sanitizes, and background-renders the html provided in
       .init().
    */
    default_render_events: [],
    init: function (data) {
        marimo.widgetlib.base_widget.init.call(this, data)
        this.render_events = this.default_render_events.concat((data.render_events || []))
        this.draw_events = (data.draw_events || [this.id+'_ready'])
        this.wc_compatibility_mode = false
        if (typeof data.wc_compatibility_mode !== 'undefined') {
            this.wc_compatibility_mode = data.wc_compatibility_mode
        }

        var self = this
        setTimeout(function() { self.render.call(self) }, 1)

        return this
    },
    render: function () {
        /* prepare this.data.html. waits until all events in this.render_events
           have fired.
        */
        var options = {writeOnGetElementById:this.wc_compatibility_mode}
        this.on(this.render_events, function() {
            this.safe_html = marimo.$.writeCapture.sanitize(this.decode(this.data.html), options)
            this.draw()
        }, this)
    },
    draw: function () {
        /* actually write sanitized html out into the DOM. waits until all
           events in this.draw_events have fired.
        */
        this.on(this.draw_events, function() {
            marimo.$('#'+this.id).html(this.safe_html)
        }, this)
    },
    decode: function (html) {
        /* this utterly painful method decodes an html hunk with script tags
           and newlines escaped.
        */
        return html.replace(/\$ENDSCRIPT/g, "</script>").replace(/\$NEWLINE/g, '\n')
    }
})
