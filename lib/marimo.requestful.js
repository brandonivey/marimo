var marimo_requestful = {
    name: 'requestful',
    init: function() {
        // batch request objects that widgets use to get fresh data about themselves
        this.requests = {}
    },
    /* an object for representing a single url and the requests that will go to
       that url.
    */
    batch_request: {
        /* initialize this batch request with some endpoint URL */
        init: function(url) {
            this.payloads = []
            if (!url) {
                console.error('batch_request needs a url')
                return
            }
            this.url = url
            return this
        },
        /* add a widget's request data to our yet-to-be-transferred payloads */
        add: function(payload) {
            if (!(payload && _.isObject(payload))) {
                console.error('batch request got strange payload:')
                consoel.error(payload)
                return
            }
            this.payloads.push(payload)
        },
        /* send a list of JSON payloads to the endpoint url associated with this batch_request object. */
        make_request: function(cb) {
            marimo.$.ajax({
                url: this.url,
                data: {bulk:JSON.stringify(this.payloads)},
                context:this,
                dataType: 'json',
                success: function(data) { cb(this.url, data) },
                error: function() {
                    var msg = marimo.printf('bulk request to %s failed with json %s', [this.url, JSON.stringify(this.payloads)])
                    console.error(msg)
                }
            })
        }
    },
    make_request: function() {
        /* tell all the batched requests in this.requests to make their
           requests to their murls.

           This method will do nothing if there is nothing in this.requests.
        */
        var handler = _.bind(this.handle_response, this)
        _.each(this.requests, function(batch) {
            batch.make_request(handler)
        })
    },
    handle_response: function(url, data) {
        /* handle a bulked response to this.make_request. use the id property
           in each response object to route the data.
        */
        delete this.requests[url]
        _.each(data, function(datum) {
            marimo.widgets[datum.id].update(datum)
            marimo.widgets[datum.id].render()
        })
    },
    widgetlib: {
        /* a widget that uses an API to get json, transforms it into
           context for a mustache template, and renders it as html
           somewhere in the DOM.
        */
        requestful_widget:  marimo.extend(marimo.widgetlib.base_widget, {
            init: function(data) {
                /* initialize this widget with an id and murl. the data object argument
                   will be assigned to this.data (as in base_widget).
                */
                this.id = data.id
                this.murl = data.murl
                this.data = data

                if (!this.data.template) {
                    // if we received no template, try and find one in the DOM.
                    var template = marimo.$('#'+this.id).html()
                    if (template) {
                        this.data.template = template
                        marimo.$('#'+this.id).html('').show()
                    }
                }

                return this
            },
            add_request: function(options) {
                /* submit a request to be batched and bulked by marimo using a
                   batch_request. No requests will be made until a call to
                   marimo.make_request.
                */
                options = options || {}
                var request_data = {
                    id: this.data.id,
                    args: this.data.args,
                    kwargs: this.data.kwargs,
                    widget_handler: this.data.widget_handler || this.data.widget_name
                }
                if (options.cache_bust) {
                    request_data.__cache_bust = String(Math.random()).substr(3,5)
                }
                if (!marimo.requestful.requests[this.murl]) {
                    marimo.requestful.requests[this.murl] = Object.create(marimo.requestful.batch_request).init(this.murl)
                }
                marimo.requestful.requests[this.murl].add(request_data)
            },
            make_request: function(data) {
                /* make a one off request to this widget's murl. upon a successful
                   response, the update and render methods of this widget are called.
                   an error will call this.handle_ajax_error.
                */
                var kwargs = JSON.stringify(this.kwargs || this.data.kwargs)
                var args = JSON.stringify(this.args || this.data.args)
                marimo.$.ajax({
                    url: this.murl,
                    type: 'GET',
                    data: {
                      widget_handler:this.data.widget_handler,
                      kwargs:kwargs,
                      args:args
                    },
                    dataType:'json',
                    context:this,
                    success: function (data) {
                        this.update(data)
                        this.render()
                    },
                    error: this.handle_ajax_error
                })
            },
            transform: function(data) {
                /* optionally mutate data into a form consumable by this.data.template.
                   transform will be called before any invocation of
                   update. Override in clones; this version is just a passthrough that
                   returns data.

                   Your most frequent use case will be to turn data into something that
                   looks like this (given, say, the response from twitter's public
                   timeline API):

                   {
                       context: {tweets: data}
                   }

                   the context property of this.data is what is used to render
                   this.data.template.
                */
                return data
            },
            update: function (data) {
                /* given some new widget data update this.data, overriding as
                   necessary. this is called automatically by .make_request() and in
                   turn calls .transform(data).
                */
                if (this.transform) data = this.transform(data)
                _.extend(this.data, data)
            },
            render: function() {
                /* combine this.data.context with this.data.template. Currently this
                   relies on Mustache. HTML will be painted to the DOM on the page's
                   onload event.

                   This will be split out into render and draw phases like
                   writecapture_widget. It will also use render_events and draw_events
                   in the same way instead of relying on onload.
                */
                // TODO split this into render, draw methods attentive to render_events and draw_events
                // TODO support a template_url (distinct from data api)
                // TODO make not-mustache-specific
                var html = Mustache.to_html(this.data.template, this.data.context)

                var that = this
                marimo.$(function() {
                    marimo.$('#'+that.id).html(html).show()
                })
            },
            handle_ajax_error: function(data) {
                /* basic handler for ajax requests made by .make_request().
                   simply uses console.error.
                */
                var status = data.status
                try {
                    var msg = JSON.parse(data.response).error
                    console.error(marimo.printf('%s: %s', [status, msg]))
                    return {status:status, msg:msg}
                } catch (e) {
                    // don't want to error out of our error handler, so use bare
                    // try/catch
                    console.error(data)
                }
            }
        })
    }
}

marimo.register_module(marimo_requestful)
