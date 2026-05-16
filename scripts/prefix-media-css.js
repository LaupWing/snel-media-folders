/**
 * Post-build: scope all Tailwind utility classes under #snel-media-wrapper
 * so they don't bleed into other WP admin elements.
 */
const fs = require( 'fs' );
const postcss = require( 'postcss' );
const prefixWrap = require( 'postcss-prefixwrap' );

const cssPath = 'build/index.css';
const rtlPath = 'build/index-rtl.css';

async function prefixFile( filePath ) {
	if ( ! fs.existsSync( filePath ) ) return;
	const css = fs.readFileSync( filePath, 'utf8' );
	const result = await postcss( [
		prefixWrap( '#snel-media-wrapper', {
			ignoredSelectors: [
				/\.snel-modal/,
				/\.snel-drop-hover/,
				/\.snel-media-snackbar/,
				/#wpbody/,
				/#snel-media-folders/,
			],
		} ),
	] ).process( css, { from: filePath } );
	fs.writeFileSync( filePath, result.css );
	console.log( `Prefixed: ${ filePath }` );
}

( async () => {
	await prefixFile( cssPath );
	await prefixFile( rtlPath );
} )();
