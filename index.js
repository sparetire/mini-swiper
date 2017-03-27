/* global Swiper */
$.ready(function () {
	window.swiper = new Swiper({
		el: '.swiper-container',
		// direction: 'vertical',
		centeredSlides: true,
		// initialSlide: 3,
		spaceBetween: 20,
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
});