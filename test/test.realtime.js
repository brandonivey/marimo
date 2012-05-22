var jsdom_wrapper = require('./util.test.js').jsdom_wrapper

exports.test_realtime = {
    // jsdom_wrapper should be smarter
    setUp: jsdom_wrapper('<html><head></head><body><div id="one"></div><div id="two"></div></body>', ['../lib/realtime.js']),
    test_no_errors: function(test) {
        marimo = this.window.marimo;
        test.done();
    }
}
