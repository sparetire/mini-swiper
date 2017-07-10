(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define(factory);
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = factory();
	} else {
		root.Swiper = factory();
	}
})(window, function () {

	function lightJQ() {
		var supportsPassive = false,
			isLoad = false;
		try {
			var opts = Object.defineProperty({}, 'passive', {
				get: function () {
					supportsPassive = true;
				}
			});
			window.addEventListener('test', null, opts);
		} catch (e) {}

		var $ = function (elem) {
			return typeof elem === 'string' ? document.querySelectorAll(elem) : elem;
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
		HTMLElement.prototype.addClass = function (className) {
			this.className += ' ' + className;
		};
		HTMLElement.prototype.removeClass = function (className) {
			var classes = this.className.split(/\s/);
			var idx = classes.indexOf(className);
			if (idx != -1) {
				for (var i = 0; i < classes.length;) {
					if (classes[i] === className) {
						classes.splice(i, 1);
						continue;
					}
					++i;
				}
				this.className = classes.join(' ');
			}
		};
		HTMLElement.prototype.on = function (event, callback) {
			this.addEventListener(event, callback, supportsPassive ? {
				passive: true
			} : false);
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

	function Swiper(opts) {
		var self = this instanceof Swiper ? this : Object.create(self);
		// container容器 dom对象
		typeof opts.el === 'string' ? self.el = $(opts.el)[0] : self.el = opts.el;
		// 滚动方向
		self.direction = opts.direction || 'horizontal';
		// 是否居中
		self.centeredSlides = !!opts.centeredSlides;
		// autoplay -> number
		self.autoplay = null;
		// slide的间隔margin
		self.spaceBetween = opts.spaceBetween || 0;
		// 起始的slide索引
		self.initialSlide = opts.initialSlide || 0;

		// 当前slide的索引
		var _activeIndex = self.initialSlide;

		function slideTo(slide) {
			var ctx = self;
			slide = slide % slideCount;
			if (ctx.direction === 'horizontal') {
				curPoint.x = nextPoint.x = originStart.x - slide * interval;
			} else {
				curPoint.y = nextPoint.y = originStart.y - slide * interval;
			}
			$(wrapper)
				.addClass('transition');
			translate(wrapper, nextPoint.x, nextPoint.y);
		}

		// 当前slide的索引，修改此变量会引起滑动
		Object.defineProperty(self, 'activeIndex', {
			get: function () {
				return _activeIndex;
			},
			set: function (value) {
				onSlideChangeStart(self);
				slideTo(value);
				_activeIndex = value;
				onSlideChangeEnd(self);
			}
		});
		// 初始化结束的回调
		var onInit = opts.onInit || function (swiper) {};
		// 开始滑动的回调
		var onSlideChangeStart = opts.onSlideChangeStart || function (swiper) {};
		// 结束滑动的回调
		var onSlideChangeEnd = opts.onSlideChangeEnd || function (swiper) {};
		// 滑动过渡结束的回调
		var onTransitionEnd = opts.onTransitionEnd || function (swiper) {};
		// container 内容区的宽度，private
		var containerWidth = opts.containerWidth || parseFloat(getComputedStyle(self
				.el)
			.width);
		// container 内容区的高度，private
		var containerHeight = opts.containerHeight || parseFloat(getComputedStyle(
				self.el)
			.height);
		// slide的宽度
		var _slideWidth = opts.slideWidth;
		// slide的高度
		var _slideHeight = opts.slideHeight;
		// wrapper dom对象，private
		var wrapper = this.el.find('.swiper-wrapper')[0];
		// 所有的slide元素数组,private
		var slides = Array.prototype.slice.call(wrapper.find('.swiper-slide')) || [];
		// slide的个数，private
		var slideCount = self.slideCount = slides.length;
		// 每个单元的元素大小，在方向的大小，算margin border padding，private
		var interval = 0;
		// 是否允许手动滑动
		var canSwipe = typeof opts.canSwipe === 'boolean' ? opts.canSwipe : true;
		// wrapper在transform坐标系中起始临界点, private
		var originStart = {
			x: 0,
			y: 0
		};
		// wrapper在transform坐标系中最终临界点，privite
		var originEnd = {
			x: 0,
			y: 0
		};
		var curPoint = {
			x: 0,
			y: 0
		};
		var lastStaticPoint = {
			x: 0,
			y: 0
		};
		var curTouchPoint = {
			x: 0,
			y: 0
		};
		var startTouchPoint = {
			x: 0,
			y: 0
		};
		var lastTouchPoint = {
			x: 0,
			y: 0
		};
		var nextPoint = {
			x: 0,
			y: 0
		};
		var sensitivity = opts.sensitivity || 2;

		function translate(elem, x, y) {
			/* eslint no-func-assign: 0 */
			if (elem.style.transform != undefined) {
				translate = function (elem, x, y) {
					elem.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0px)';
				};
			} else {
				translate = function (elem, x, y) {
					elem.style.webkitTransform = 'translate3d(' + x + 'px, ' + y +
						'px, 0px)';
				};
			}
			translate(elem, x, y);
		}



		var operation = {
			setHorizontalMargin: function (spaceBetween) {
				slides.forEach(function (slide, idx, arr) {
					if (idx === arr.length - 1) {
						return;
					}
					slide.style.marginRight = spaceBetween + 'px';
				});
			},
			setVerticalMargin: function (spaceBetween) {
				slides.forEach(function (slide, idx, arr) {
					if (idx === arr.length - 1) {
						return;
					}
					slide.style.marginBottom = spaceBetween + 'px';
				});
			},
			getBoxWidth: function (elem) {
				if (_slideWidth) {
					return _slideWidth;
				}
				var slideComputedStyle = getComputedStyle(elem);
				var slideWidth = parseFloat(slideComputedStyle.width);
				var slidePdLeft = parseFloat(slideComputedStyle.paddingLeft);
				var slidePdRight = parseFloat(slideComputedStyle.paddingRight);
				var slideBorderLeft = parseFloat(slideComputedStyle.borderLeftWidth);
				var slideBorderRight = parseFloat(slideComputedStyle.borderRightWidth);
				return slideWidth + slidePdLeft + slidePdRight + slideBorderLeft +
					slideBorderRight;
			},
			getBoxHeight: function (elem) {
				if (_slideHeight) {
					return _slideHeight;
				}
				var slideComputedStyle = getComputedStyle(elem);
				var slideHeight = parseFloat(slideComputedStyle.height);
				var slidePdTop = parseFloat(slideComputedStyle.paddingTop);
				var slidePdBottom = parseFloat(slideComputedStyle.paddingBottom);
				var slideBorderTop = parseFloat(slideComputedStyle.borderTopWidth);
				var slideBorderBottom = parseFloat(slideComputedStyle.borderBottomWidth);
				return slideHeight + slidePdTop + slidePdBottom + slideBorderTop +
					slideBorderBottom;
			},
			transformAxisX: function (slideBoxWidth) {
				if (self.centeredSlides) {
					// transform坐标系原点变换
					originStart.x = (containerWidth - slideBoxWidth) / 2;
					// transform坐标系变换，以originStart点为原点
					curPoint.x = lastStaticPoint.x = nextPoint.x = originStart.x;
				}
				originEnd.x = originStart.x - (slideCount - 1) * interval;
				curPoint.x -= self.initialSlide * interval;
				lastStaticPoint.x = curPoint.x;
			},
			transformAxisY: function (slideBoxHeight) {
				if (self.centeredSlides) {
					// transform坐标系原点变换
					originStart.y = (containerHeight - slideBoxHeight) / 2;
					// transform坐标系变换，以originStart点为原点
					curPoint.y = lastStaticPoint.y = nextPoint.y = originStart.y;
				}
				originEnd.y = originStart.y - (slideCount - 1) * interval;
				curPoint.y -= self.initialSlide * interval;
				lastStaticPoint.y = curPoint.y;
			},
			getMultiple: function (distance) {
				var v = 0;
				if (distance < 0) {
					v = 1;
				} else if (distance > 0) {
					v = -1;
				}
				if (Math.abs(distance) % interval < interval / sensitivity) {
					return Math.floor(Math.abs(distance) / interval) * v;
				} else {
					return Math.ceil(Math.abs(distance) / interval) * v;
				}
			}
		};

		function init(opts) {
			var ctx = self;
			if (ctx.direction === 'horizontal') {
				if (ctx.spaceBetween) {
					operation.setHorizontalMargin(ctx.spaceBetween);
				}
				var slideBoxWidth = operation.getBoxWidth(slides[0]);
				interval = slideBoxWidth + ctx.spaceBetween;
				operation.transformAxisX(slideBoxWidth);
				translate(wrapper, curPoint.x, 0);
			} else if (ctx.direction === 'vertical') {
				wrapper.addClass('swiper-wrapper-vertical');
				slides.forEach(function (slide) {
					slide.addClass('swiper-slide-vertical');
				});
				if (ctx.spaceBetween) {
					operation.setVerticalMargin(ctx.spaceBetween);
				}
				var slideBoxHeight = operation.getBoxHeight(slides[0]);
				interval = slideBoxHeight + ctx.spaceBetween;
				operation.transformAxisY(slideBoxHeight);
				translate(wrapper, 0, curPoint.y);
			}
			onInit(self);
		}

		init();

		if (canSwipe) {
			$(wrapper)
				.on('touchstart', function (event) {
					lastTouchPoint.x = startTouchPoint.x = event.targetTouches[0].screenX;
					lastTouchPoint.y = startTouchPoint.y = event.targetTouches[0].screenY;
					lastStaticPoint.x = curPoint.x;
					lastStaticPoint.y = curPoint.y;
				});

			$(wrapper)
				.on('touchmove', function (event) {
					curTouchPoint.x = event.targetTouches[0].screenX;
					curTouchPoint.y = event.targetTouches[0].screenY;
					var dx = curTouchPoint.x - lastTouchPoint.x;
					var dy = curTouchPoint.y - lastTouchPoint.y;
					curPoint.x += dx;
					curPoint.y += dy;
					if (self.direction === 'horizontal') {
						translate(wrapper, curPoint.x, 0);
					} else {
						translate(wrapper, 0, curPoint.y);
					}
					lastTouchPoint.x = curTouchPoint.x;
					lastTouchPoint.y = curTouchPoint.y;
				});

			$(wrapper)
				.on('touchend', function (event) {
					// touchend的targetTouches是空的
					curTouchPoint.x = event.changedTouches[0].screenX;
					curTouchPoint.y = event.changedTouches[0].screenY;
					// 本次滑动的距离
					var distanceX = curTouchPoint.x - startTouchPoint.x;
					var distanceY = curTouchPoint.y - startTouchPoint.y;
					var multiple = 0;
					var isStatic = false;
					if (self.direction === 'horizontal') {
						Math.abs(distanceX) < 1 && (isStatic = true);
						multiple = operation.getMultiple(distanceX);
					} else {
						Math.abs(distanceX) < 1 && (isStatic = true);
						multiple = operation.getMultiple(distanceY);
					}
					if (self.activeIndex + multiple < 0) {
						self.activeIndex = 0;
					} else if (self.activeIndex + multiple > slideCount - 1) {
						self.activeIndex = slideCount - 1;
					} else {
						self.activeIndex += multiple;
					}
					if (isStatic) {
						wrapper.removeClass('transition');
					}
				});
		}


		function transitionEnd(event) {
			$(this)
				.removeClass('transition');
			onTransitionEnd(self);
		}

		$(wrapper)
			.on('transitionend', transitionEnd);
		$(wrapper)
			.on('webkitTransitionEnd', transitionEnd);
		$(wrapper)
			.on('oTransitionEnd', transitionEnd);

		// todo 临时方案，到时候实现一个代理
		self.setSlideCount = function (count) {
			slideCount = count;
		};

		return self;
	}

	return Swiper;
});