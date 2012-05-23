var marimo_writecapture = {
    name: 'writecapture',
    init: function() {
        this.widgetlib.writecapture_widget.module = marimo.writecapture
        return this
    },
    decode: function(html) {
        /* this utterly painful method decodes an html hunk with script tags
           and newlines escaped.
        */
        return html.replace(/\$ENDSCRIPT/g, "</script>").replace(/\$NEWLINE/g, '\n')
    },
    widgetlib: {
        writecapture_widget: marimo.extend(marimo.widgetlib.base_widget, {
            /* a widget for handling html with potentially horrible javascript.
               sandboxes, sanitizes, and background-renders the html provided in
               .init().
            */
            default_render_events: [],
            init: function(data) {
                marimo.widgetlib.base_widget.init.call(this, data)
                this.render_events = this.default_render_events.concat((data.render_events || []))
                this.draw_events = (data.draw_events || [this.id+'_ready'])
                this.wc_compatibility_mode = false
                if (data.wc_compatibility_mode) {
                    this.wc_compatibility_mode = true
                }

                _.defer(_.bind(this.render, this))

                return this
            },
            render: function() {
                /* prepare this.data.html. waits until all events in this.render_events
                   have fired.
                */
                var options = {writeOnGetElementById:this.wc_compatibility_mode}
                this.on(this.render_events, function() {
                    this.safe_html = marimo.$.writeCapture.sanitize(this.module.decode(this.data.html), options)
                    this.draw()
                })
            },
            draw: function() {
                /* actually write sanitized html out into the DOM. waits until all
                   events in this.draw_events have fired.
                */
                this.on(this.draw_events, function() {
                    marimo.$('#'+this.id).html(this.safe_html)
                })
            }
        })
    }
}

marimo.register_module(marimo_writecapture)
