// import $ from './lib/light-jq';
function lightJQ() {
	var supportsPassive = false,
		isLoad = false;
	try {
		var opts = Object.defineProperty({}, 'passive', {
			get: function () {
				supportsPassive = true;
			}
		});
		window.addEventListener("test", null, opts);
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

window.$ = lightJQ();

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
	self.spaceBetween = opts.spaceBetween;
	// 起始的slide索引
	self.initialSlide = opts.initialSlide || 0;

	// 当前slide的索引
	var _activeIndex = self.initialSlide;

	// 当前slide的索引，修改此变量会引起滑动
	Object.defineProperty(self, 'activeIndex', {
		get: function () {
			return _activeIndex;
		},
		set: function (value) {
			self.slideTo(value);
		}
	});
	// 开始滑动的回调
	self.onSlideChangeStart = opts.onSlideChangeStart || function (swiper) {};
	// 结束滑动的回调
	self.onSlideChangeEnd = opts.onSlideChangeEnd || function (swiper) {};
	// 滑动过渡结束的回调
	self.onTransitionEnd = opts.onTransitionEnd || function (swiper) {};
	// container 内容区的宽度，private
	var containerWidth = parseFloat(getComputedStyle(self.el).width);
	// container 内容区的高度，private
	var containerHeight = parseFloat(getComputedStyle(self.el).height);
	// wrapper dom对象，private
	var wrapper = this.el.find('.swiper-wrapper')[0];
	// 所有的slide元素数组,private
	var slides = Array.prototype.slice.call(wrapper.find('.swiper-slide')) || [];
	// slide的个数，private
	var slideCount = slides.length;
	// 每个单元的元素大小，在方向的大小，算margin border padding，private
	var interval = 0;
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
	

	if (typeof Swiper.prototype.slideTo != 'function') {
		Swiper.prototype.slideTo = function (slide) {
			var ctx = this;
			slide = slide % slideCount;
			ctx.onSlideChangeStart(ctx);
			_activeIndex = slide;
			if (ctx.direction === 'horizontal') {
				curPoint.x = nextPoint.x = originStart.x - slide * interval;
			} else {
				curPoint.y = nextPoint.y = originStart.y - slide * interval;
			}
			ctx.onSlideChangeEnd(ctx);
			$(wrapper).addClass('transition');
			if (wrapper.style.transform != undefined) {
				wrapper.style.transform = 'translate3d('+nextPoint.x+'px, '+nextPoint.y+'px, 0px)';
			} else {
				wrapper.style.webkitTransform = 'translate3d('+nextPoint.x+'px, '+nextPoint.y+'px, 0px)';
			}
		};
	}

	if (typeof Swiper.prototype.init != 'function') {
		Swiper.prototype.init = function (opts) {
			var ctx = this, slideComputedSyle;
			if (ctx.direction === 'horizontal') {
				if (ctx.spaceBetween) {
					slides.forEach(function (slide, idx) {
						if (idx === slides.length - 1) {
							return;
						}
						slide.style.marginRight = ctx.spaceBetween + 'px';
					});
				}
				slideComputedSyle = getComputedStyle(slides[0]);
				var slideWidth = parseFloat(slideComputedSyle.width);
				var slidePdLeft = parseFloat(slideComputedSyle.paddingLeft);
				var slidePdRight = parseFloat(slideComputedSyle.paddingRight);
				var slideBorderLeft = parseFloat(slideComputedSyle.borderLeftWidth);
				var slideBorderRight = parseFloat(slideComputedSyle.borderRightWidth);
				var slideBoxWidth = slideWidth + slidePdLeft + slidePdRight + slideBorderLeft + slideBorderRight;
				interval = slideBoxWidth + ctx.spaceBetween;
				if (ctx.centeredSlides) {
					// transform坐标系原点变换
					originStart.x = (containerWidth - slideBoxWidth) / 2;
					// transform坐标系变换，以originStart点为原点
					curPoint.x = lastStaticPoint.x = nextPoint.x = originStart.x;
				}
				originEnd.x = originStart.x - (slideCount - 1) * interval;
				curPoint.x -= ctx.initialSlide * interval;
				lastStaticPoint.x = curPoint.x;
				if (wrapper.style.transform != undefined) {
					wrapper.style.transform = 'translate3d('+curPoint.x+'px, 0px, 0px)';
				} else {
					wrapper.style.webkitTransform = 'translate3d('+curPoint.x+'px, 0px, 0px)'; 
				}
			} else if (ctx.direction === 'vertical') {
				wrapper.addClass('swiper-wrapper-vertical');
				slides.forEach(function (slide) {
					slide.addClass('swiper-slide-vertical');
				});
				if (ctx.spaceBetween) {
					slides.forEach(function (slide, idx) {
						if (idx === slides.length - 1) {
							return;
						}
						slide.style.marginBottom = ctx.spaceBetween + 'px';
					});
				}
				slideComputedSyle = getComputedStyle(slides[0]);
				var slideHeight = parseFloat(slideComputedSyle.height);
				var slidePdTop = parseFloat(slideComputedSyle.paddingTop);
				var slidePdBottom = parseFloat(slideComputedSyle.paddingBottom);
				var slideBorderTop = parseFloat(slideComputedSyle.borderTopWidth);
				var slideBorderBottom = parseFloat(slideComputedSyle.borderBottomWidth);
				var slideBoxHeight = slideHeight + slidePdTop + slidePdBottom + slideBorderTop + slideBorderBottom;
				interval = slideBoxHeight + ctx.spaceBetween;
				if (ctx.centeredSlides) {
					// transform坐标系原点变换
					originStart.y = (containerHeight - slideBoxHeight) / 2;
					// transform坐标系变换，以originStart点为原点
					curPoint.y = lastStaticPoint.y = nextPoint.y = originStart.y;
				}
				originEnd.y = originStart.y - (slideCount - 1) * interval;
				curPoint.y -= ctx.initialSlide * interval;
				lastStaticPoint.y = curPoint.y;
				if (wrapper.style.transform != undefined) {
					wrapper.style.transform = 'translate3d(0px, '+curPoint.y+'px, 0px)';
				} else {
					wrapper.style.webkitTransform = 'translate3d(0px, '+curPoint.y+'px, 0px)';
				}
			}
		};
	}

	self.init();

	$(wrapper).on('touchstart', function (event) {
		lastTouchPoint.x = startTouchPoint.x = event.targetTouches[0].screenX;
		lastTouchPoint.y = startTouchPoint.y = event.targetTouches[0].screenY;
		lastStaticPoint.x = curPoint.x;
		lastStaticPoint.y = curPoint.y;
		self.onSlideChangeStart(self);
	});

	$(wrapper).on('touchmove', function (event) {
		curTouchPoint.x = event.targetTouches[0].screenX;
		curTouchPoint.y = event.targetTouches[0].screenY;
		var dx = curTouchPoint.x - lastTouchPoint.x;
		var dy = curTouchPoint.y - lastTouchPoint.y;
		curPoint.x += dx;
		curPoint.y += dy;
		if (self.direction === 'horizontal') {
			if (wrapper.style.transform != undefined) {
				wrapper.style.transform = 'translate3d('+curPoint.x+'px, 0px, 0px)';
			} else {
				wrapper.style.webkitTransform = 'translate3d('+curPoint.x+'px, 0px, 0px)';
			}
		} else {
			if (wrapper.style.transform != undefined) {
				wrapper.style.transform = 'translate3d(0px, '+curPoint.y+'px, 0px)';
			} else {
				wrapper.style.webkitTransform = 'translate3d(0px, '+curPoint.y+'px, 0px)';
			}
		}
		lastTouchPoint.x = curTouchPoint.x;
		lastTouchPoint.y = curTouchPoint.y;
	});

	$(wrapper).on('touchend', function (event) {
		// touchend的targetTouches是空的
		curTouchPoint.x = event.changedTouches[0].screenX;
		curTouchPoint.y = event.changedTouches[0].screenY;
		// 本次滑动的距离
		var distanceX = curTouchPoint.x - startTouchPoint.x;
		var distanceY = curTouchPoint.y - startTouchPoint.y;
		console.log(distanceX);
		// alert(distanceX);
		var multiple = 1;
		if (self.direction === 'horizontal') {
			if (self.activeIndex === 0 && distanceX > 0) {
				curPoint.x = nextPoint.x = originStart.x;
				curPoint.y = nextPoint.y = originStart.y;
				$(this).addClass('transition');
				if (wrapper.style.transform != undefined) {
					wrapper.style.transform = 'translate3d('+nextPoint.x+'px, '+nextPoint.y+'px, 0px)';
				} else {
					wrapper.style.webkitTransform = 'translate3d('+nextPoint.x+'px, '+nextPoint.y+'px, 0px)';
				}
				self.onSlideChangeEnd(self);
				return;
			} else if (self.activeIndex === slideCount - 1 && distanceX < 0) {
				curPoint.x = nextPoint.x = originEnd.x;
				curPoint.y = nextPoint.y = originEnd.y;
				$(this).addClass('transition');
				if (wrapper.style.transform != undefined) {
					wrapper.style.transform = 'translate3d('+nextPoint.x+'px, '+nextPoint.y+'px, 0px)';
				} else {
					wrapper.style.webkitTransform = 'translate3d('+nextPoint.x+'px, '+nextPoint.y+'px, 0px)';
				}
				self.onSlideChangeEnd(self);
				return;
			}
			if (Math.abs(distanceX) < interval / 2) {
				nextPoint.x = lastStaticPoint.x;
			} else {
				if (Math.abs(distanceX) % interval < interval / 2) {
					multiple = Math.floor(Math.abs(distanceX) / interval);
				} else {
					multiple = Math.ceil(Math.abs(distanceX) / interval);
				}
				if (distanceX < 0) {
					nextPoint.x = lastStaticPoint.x - multiple * interval;
					_activeIndex += multiple;
				} else {
					nextPoint.x = lastStaticPoint.x + multiple * interval;
					_activeIndex -= multiple;
				}
			}
		} else {
			if (self.activeIndex === 0 && distanceY > 0) {
				curPoint.x = nextPoint.x = originStart.x;
				curPoint.y = nextPoint.y = originStart.y;
				$(this).addClass('transition');
				if (wrapper.style.transform != undefined) {
					wrapper.style.transform = 'translate3d('+nextPoint.x+'px, '+nextPoint.y+'px, 0px)';
				} else {
					wrapper.style.webkitTransform = 'translate3d('+nextPoint.x+'px, '+nextPoint.y+'px, 0px)';
				}
				self.onSlideChangeEnd(self);
				return;
			} else if (self.activeIndex === slideCount - 1 && distanceY < 0) {
				curPoint.x = nextPoint.x = originEnd.x;
				curPoint.y = nextPoint.y = originEnd.y;
				$(this).addClass('transition');
				if (wrapper.style.transform != undefined) {
					wrapper.style.transform = 'translate3d('+nextPoint.x+'px, '+nextPoint.y+'px, 0px)';
				} else {
					wrapper.style.webkitTransform = 'translate3d('+nextPoint.x+'px, '+nextPoint.y+'px, 0px)';
				}
				self.onSlideChangeEnd(self);
				return;
			}
			if (Math.abs(distanceY) < interval / 2) {
				nextPoint.y = lastStaticPoint.y;
			} else {
				if (Math.abs(distanceY) % interval < interval / 2) {
					multiple = Math.floor(Math.abs(distanceY) / interval);
				} else {
					multiple = Math.ceil(Math.abs(distanceY) / interval);
				}
				if (distanceY < 0) {
					nextPoint.y = lastStaticPoint.y - multiple * interval;
					_activeIndex += multiple;
				} else {
					nextPoint.y = lastStaticPoint.y + multiple * interval;
					_activeIndex -= multiple;
				}
			}
		}
		curPoint.x = nextPoint.x;
		curPoint.y = nextPoint.y;
		$(this).addClass('transition');
		if (wrapper.style.transform != undefined) {
			wrapper.style.transform = 'translate3d('+nextPoint.x+'px, '+nextPoint.y+'px, 0px)';
		} else {
			wrapper.style.webkitTransform = 'translate3d('+nextPoint.x+'px, '+nextPoint.y+'px, 0px)';
		}
		self.onSlideChangeEnd(self);
	});

	function transitionEnd(event) {
		$(this).removeClass('transition');
		self.onTransitionEnd(self);
	}

	$(wrapper).on('transitionend', transitionEnd);
	$(wrapper).on('webkitTransitionEnd', transitionEnd);
	$(wrapper).on('oTransitionEnd', transitionEnd);
	
	return self;
}

// export default Swiper;