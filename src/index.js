/**
 * Snel Media Folders — Media Library folder sidebar.
 *
 * Two modes:
 * 1. Upload screen (upload.php) — sidebar injected into #wpbody
 * 2. Media modal (everywhere else) — sidebar injected into .media-modal-content
 */
import { createRoot } from '@wordpress/element';
import App from './components/App';
import './styles/main.css';

const isUploadScreen = window.snelMediaFolders?.isUploadScreen === '1';

/**
 * Upload screen — inject sidebar into #wpbody.
 */
const initUploadScreen = () => {
	const wpbody = document.getElementById( 'wpbody' );
	const wpbodyContent = document.getElementById( 'wpbody-content' );
	if ( ! wpbody || ! wpbodyContent ) return;

	const container = document.createElement( 'div' );
	container.id = 'snel-media-folders';
	wpbody.insertBefore( container, wpbodyContent );
	wpbody.classList.add( 'snel-media-layout' );

	const root = createRoot( container );
	root.render( <App mode="page" /> );
};

/**
 * Media modal — watch for modals opening and inject sidebar.
 */
const initModalWatcher = () => {
	// Use MutationObserver to detect when media modals are added to the DOM.
	const observer = new MutationObserver( ( mutations ) => {
		for ( const mutation of mutations ) {
			for ( const node of mutation.addedNodes ) {
				if ( node.nodeType !== 1 ) continue;

				// Check if a media modal was added.
				const modal = node.classList?.contains( 'media-modal' )
					? node
					: node.querySelector?.( '.media-modal' );

				if ( modal && ! modal.querySelector( '#snel-media-folders-modal' ) ) {
					injectIntoModal( modal );
				}
			}
		}
	} );

	observer.observe( document.body, { childList: true, subtree: true } );
};

const injectIntoModal = ( modal ) => {
	const mediaFrame = modal.querySelector( '.media-frame' );
	const mediaMenu = modal.querySelector( '.media-menu' );
	if ( ! mediaMenu || ! mediaFrame ) return;

	// Remove hide-menu so the left panel is visible.
	mediaFrame.classList.remove( 'hide-menu' );

	// Add class to the modal wrapper for CSS targeting.
	const mediaModal = modal.closest( '.media-modal' );
	if ( mediaModal ) mediaModal.classList.add( 'snel-modal' );

	// Create sidebar container and append inside the menu.
	const container = document.createElement( 'div' );
	container.id = 'snel-media-folders-modal';
	container.className = 'snel-modal-sidebar';
	mediaMenu.appendChild( container );

	const root = createRoot( container );
	root.render( <App mode="modal" /> );
};

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', () => {
		if ( isUploadScreen ) {
			initUploadScreen();
		}
		initModalWatcher();
	} );
} else {
	if ( isUploadScreen ) {
		initUploadScreen();
	}
	initModalWatcher();
}
