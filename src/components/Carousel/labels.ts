// Carousel's own words, in English and Indonesian. tools/build/registry.mjs adds them to SerupaLabels,
// enLabels and idLabels, so <SerupaProvider labels> changes them like any other label.
export interface CarouselLabels {
  /** Carousel arrows. */
  previousSlide: string;
  nextSlide: string;
  /** Carousel: each slide's name, and its dot's ("2 of 5"). */
  slideOf: (slide: number, total: number) => string;
  /** What a screen reader calls the carousel and each slide (aria-roledescription). */
  carouselRole: string;
  slideRole: string;
}
export const en: CarouselLabels = {
  previousSlide: "Previous slide",
  nextSlide: "Next slide",
  slideOf: (slide, total) => slide + " of " + total,
  carouselRole: "carousel",
  slideRole: "slide",
};
export const id: CarouselLabels = {
  previousSlide: "Slide sebelumnya",
  nextSlide: "Slide berikutnya",
  slideOf: (slide, total) => slide + " dari " + total,
  carouselRole: "korsel",
  slideRole: "slide",
};
