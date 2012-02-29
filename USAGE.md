# Marimo Users Guide

Sourcing marimo.js instantiates the toplevel ``marimo`` object, which should be initialized with your preferred DOM library.

	marimo.init(jQuery)

The library will be bound to ``marimo.$``.

At this point the marimo object is ready for use:

	marimo: {
		widgets       : {...}
		batch_request : {...}
		widgetlib     : {...}

		requests      : {...}
		events        : {...}

		add_widget      : function (widget_args)
		add_widgets     : function (widgets)
		emit            : function (evnt)
		extend          : function (obj, ex)
		handle_response : function (url, data)
		make_request    : function ()
		printf          : function (str, args)
	}

``marimo.widgetlib`` contains classes of widgets. By default: 

	marimo.widgetlib: {
		base_widget                      : {...}
		request_widget(base_widget)      : {...}
		writecapture_widget(base_widget) : {...}
	}

``marimo.widgetlib.base_widget`` is the superclass for all widget functionality:

	marimo.widgetlib.base_widget: {
		init
		update
		render
		on
		emit
		domwire
	}

## Creating a widget

1. Extend ``base_widget``

2. Add your object to maimo.widgetlib (why?)


		widgets       : {...}
			widget-id-1: {...}
			widget-id-2: {...}
		}
		batch_request : {
			add          : function add(payload)
			init         : function init(url)
			make_request : function make_request(cb)
		}
		widgetlib     : {
			base_widget         : Object
			request_widget      : Object
			writecapture_widget : Object
		}
