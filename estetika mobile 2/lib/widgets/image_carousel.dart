import 'package:flutter/material.dart';
import 'package:flutter_carousel_slider/carousel_slider.dart';

class ImageCarousel extends StatelessWidget {
  final List<String> imageList;
  final double height;
  final bool enableAutoSlide;
  final Duration autoSlideDelay;

  const ImageCarousel({
    super.key,
    required this.imageList,
    this.height = 200.0,
    this.enableAutoSlide = true,
    this.autoSlideDelay = const Duration(seconds: 10),
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      child: CarouselSlider(
        slideTransform: const CubeTransform(),
        slideIndicator: CircularSlideIndicator(
          padding: const EdgeInsets.only(bottom: 20),
          currentIndicatorColor: const Color(0xff0a4b39),
        ),
        autoSliderDelay: autoSlideDelay,
        enableAutoSlider: enableAutoSlide,
        unlimitedMode: true,
        viewportFraction: 0.9,
        children: imageList.map((imagePath) {
          return Builder(
            builder: (BuildContext context) {
              return Container(
                width: MediaQuery.of(context).size.width,
                margin: const EdgeInsets.symmetric(horizontal: 5.0),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10.0),
                  image: DecorationImage(
                    image: AssetImage(imagePath),
                    fit: BoxFit.cover,
                  ),
                ),
              );
            },
          );
        }).toList(),
      ),
    );
  }
}
