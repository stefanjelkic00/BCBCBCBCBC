
import $ from 'jquery';
var Loader = {};

Loader.start = function () {
    $('body').spinner().start();
};

Loader.stop = function () {
    $('body').spinner().stop();
};
export default Loader;
