var jsdom_wrapper = require('./util.test.js').jsdom_wrapper

exports.test_events = {
    setUp: jsdom_wrapper(),
    test_marimo_on_and_emit: function(test) {
        var marimo = this.window.marimo
        var event_fired = false
        marimo.events.on('test_event', function() {
            event_fired = true
        })
        marimo.events.emit('test_event')
        test.ok(marimo.events.seen('test_event'),true,'event firing registered')
        test.ok(event_fired, 'event was fired')
        test.done()
    },
    test_widget_on: function(test) {
        var marimo = this.window.marimo
        marimo.add_widget({id:'one'})
        var event_caught = false
        marimo.widgets.one.on('test_on', function() {
            event_caught = true
        }, marimo.widgets.one)
        marimo.events.emit('test_on')
        test.ok(event_caught, 'test_on event was caught by widget')

        test.done()
    },
    test_widget_ons: function(test) {
        var marimo = this.window.marimo
        marimo.add_widget({id:'one'})
        var listener_triggered = false
        marimo.widgets.one.on(['event1', 'event2', 'event3'], function() {
            listener_triggered = true
        })
        marimo.events.emit('event1')
        test.equal(marimo.events.seen('event1'), true, 'event1 registerd')
        test.equal(listener_triggered, false, 'listener not triggered after event1')
        marimo.events.emit('event2')
        test.equal(marimo.events.seen('event2'), true, 'event2 registerd')
        test.equal(listener_triggered, false, 'listener not triggered after event2')
        marimo.events.emit('event3')
        test.equal(marimo.events.seen('event3'), true, 'event3 registerd')
        test.equal(listener_triggered, true, 'listener triggered after event3')
        test.done()
    },
    test_event_data: function(test) {
        var marimo = this.window.marimo
        marimo.add_widget({id:'one'})
        var passed_arg = null
        var data = {rainbow:'unicorn'}
        marimo.widgets.one.on('test_data_event', function(data) {
            passed_arg = data
        })
        marimo.events.emit('test_data_event', data)
        test.equal(passed_arg, data, 'data passed via emit')
        test.done()
    },
    test_widget_emit: function(test) {
        var marimo = this.window.marimo
        marimo.add_widget({id:'one'})
        marimo.add_widget({id:'two'})
        var passed_arg = null
        var data = {rainbow:'unicorn'}
        marimo.widgets.two.on('test_emit_event', function(data) {
            passed_args = data
        })
        marimo.widgets.one.emit('test_emit_event', data)
        test.equal(passed_args._sender, 'one', "two saw one's event")
        test.done()
    }
}
