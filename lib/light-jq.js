function lightJQ() {
	var supportsPassive = false, isLoad = false;
	try {
		var opts = Object.defineProperty({}, 'passive', {
			get: function () {
				supportsPassive = true;
			}
		});
		window.addEventListener("test", null, opts);
	} catch (e) {}

	var $ = function (elem) {
		return typeof elem === 'string' ? document.querySelector(elem) : elem;
	};
	
	$.ready = function (callback) {
		document.addEventListener('DOMContentLoaded', function () {
			if (isLoad) return;
			isLoad = true;
			callback();
		});
		window.onload = function () {
			if (isLoad) return;
			isLoad = true;
			callback();
		};
	};
	HTMLElement.prototype.on = function (event, callback) {
		this.addEventListener(event, callback, supportsPassive ? { passive: true } : false);
	};
	HTMLElement.prototype.find = function (elem) {
		// 这里会有 querySelector 的坑，使用时注意
		return this.querySelectorAll(elem);
	};
	NodeList.prototype.find = function (elem) {
		return [].reduce.call(this, function (prev, next) {
			var nodes = [].slice.call(next.querySelectorAll(elem));
			return prev.concat(nodes);
		}, []);
	};
	HTMLElement.prototype.width = function (value) {
		if (value) {
			this.style.width = value + 'px';
		} else {
			return this.offsetWidth;
		}
	};
	HTMLElement.prototype.height = function (value) {
		if (value) {
			this.style.height = value + 'px';
		} else {
			return this.offsetHeight;
		}
	};
	HTMLElement.prototype.css = function (property, value) {
		this.style[property] = value;
	};
	return $;
}

var $ = lightJQ();

export default $;