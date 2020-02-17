let mix = require('laravel-mix');

mix
    .js( "assets/scripts/scripts.js", 'assets/scripts/scripts.min.js')
    .sass('assets/styles/styles.scss', 'assets/styles/styles.min.css')
    .options({
            processCssUrls: false
    });
;