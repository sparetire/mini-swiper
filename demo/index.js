/* global Swiper */
window.onload = function () {
	window.swiper = new Swiper({
		el: '.swiper-container',
		// direction: 'vertical',
		centeredSlides: true,
		// initialSlide: 3,
		spaceBetween: 20,
		onInit: function (swiper) {
			console.log('init');
		},
		onSlideChangeStart: function (swiper) {
			console.log(swiper.activeIndex);
		},
		onSlideChangeEnd: function (swiper) {
			console.log(swiper.activeIndex);
		},
		onTransitionEnd: function (swiper) {
			console.log(swiper.activeIndex);
		}
	});
};