import { useState, useEffect, useRef, useMemo, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { SnackbarList } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import FolderTree from './FolderTree';
import SortDropdown from './SortDropdown';
import FolderContextMenu from './FolderContextMenu';
import * as api from '../services/api';

function sortFolders( folders, sortBy ) {
	const sorted = [ ...folders ];
	switch ( sortBy ) {
		case 'alpha':
			sorted.sort( ( a, b ) => a.name.localeCompare( b.name ) );
			break;
		case 'most':
			sorted.sort( ( a, b ) => b.count - a.count );
			break;
		case 'latest':
		default:
			sorted.sort( ( a, b ) => {
				if ( a.createdAt && b.createdAt ) return new Date( b.createdAt ) - new Date( a.createdAt );
				return b.id - a.id;
			} );
			break;
	}
	return sorted;
}

// Global folder filter — injected into every wp.ajax attachment query.
let currentFolderId = -1;
let onUploadComplete = null;

// Hook into WordPress's AJAX attachment query to inject our folder param.
// Skip when querying specific posts (post__in) — that's WordPress validating a selection.
if ( typeof jQuery !== 'undefined' ) {
	jQuery.ajaxPrefilter( ( options ) => {
		if (
			options.data &&
			typeof options.data === 'string' &&
			options.data.includes( 'action=query-attachments' ) &&
			! options.data.includes( 'post__in' )
		) {
			if ( currentFolderId !== -1 ) {
				options.data += '&snel_folder=' + currentFolderId;
			}
		}
	} );
}

// Hook into WordPress's uploader to pass folder ID on file upload.
if ( typeof wp !== 'undefined' && wp.Uploader ) {
	const origInit = wp.Uploader.prototype.init;
	wp.Uploader.prototype.init = function() {
		origInit.apply( this, arguments );
		this.uploader?.bind( 'BeforeUpload', () => {
			if ( currentFolderId > 0 ) {
				this.uploader.settings.multipart_params.snel_folder = currentFolderId;
			}
		} );
		this.uploader?.bind( 'UploadComplete', () => {
			if ( onUploadComplete ) onUploadComplete();
			// Re-apply folder filter after upload resets the grid.
			if ( currentFolderId !== -1 ) {
				setTimeout( () => filterMediaByFolder( currentFolderId ), 500 );
			}
		} );
	};
}

/**
 * Trigger WordPress media library to re-fetch with folder filter.
 */
function filterMediaByFolder( folderId ) {
	currentFolderId = folderId;

	// Update any existing plupload instances with the folder ID.
	if ( typeof window._wpPluploadSettings !== 'undefined' ) {
		if ( folderId > 0 ) {
			window._wpPluploadSettings.defaults.multipart_params.snel_folder = folderId;
		} else {
			delete window._wpPluploadSettings.defaults.multipart_params.snel_folder;
		}
	}

	if ( typeof wp === 'undefined' || ! wp.media ) return;

	// Find any active attachment collections and force re-fetch.
	const refreshCollections = () => {
		// Modal frame.
		try {
			const frame = wp.media.frame;
			if ( frame ) {
				const library = frame.state()?.get( 'library' );
				if ( library ) {
					library.props.set( { snel_folder_trigger: +new Date() } );
					return;
				}
			}
		} catch ( e ) {}

		// upload.php grid — find the attachments browser and reset.
		try {
			if ( wp.media.frame?.content?.get?.()?.collection ) {
				wp.media.frame.content.get().collection.props.set( { snel_folder_trigger: +new Date() } );
				return;
			}
		} catch ( e ) {}

		// Last resort — find any Attachments collection on the page.
		try {
			if ( wp.media.frame?.states ) {
				wp.media.frame.states.each( ( state ) => {
					const lib = state.get( 'library' );
					if ( lib ) lib.props.set( { snel_folder_trigger: +new Date() } );
				} );
			}
		} catch ( e ) {}
	};

	refreshCollections();
}

export default function App( { mode = 'page' } ) {
	const [ folders, setFolders ] = useState( [] );
	const [ activeFolder, setActiveFolder ] = useState( -1 );
	const [ newFolderName, setNewFolderName ] = useState( '' );
	const [ isCreating, setIsCreating ] = useState( false );
	const [ sortBy, setSortBy ] = useState( 'latest' );
	const [ search, setSearch ] = useState( '' );
	const [ totalCount, setTotalCount ] = useState( 0 );
	const [ uncategorizedCount, setUncategorizedCount ] = useState( 0 );
	const [ loading, setLoading ] = useState( true );
	const [ contextMenu, setContextMenu ] = useState( null );

	const loadFolders = useCallback( async () => {
		try {
			const data = await api.fetchFolders();
			setFolders( data.folders || [] );
			setTotalCount( data.totalCount || 0 );
			setUncategorizedCount( data.uncategorizedCount || 0 );
		} catch ( err ) {
			console.error( '[MediaFolders] Failed to load folders:', err );
		} finally {
			setLoading( false );
		}
	}, [] );

	const sidebarRef = useRef( null );
	const { createNotice, removeNotice } = useDispatch( noticesStore );
	const snackbarNotices = useSelect( ( select ) =>
		select( noticesStore ).getNotices().filter( ( n ) => n.type === 'snackbar' )
	);

	useEffect( () => {
		onUploadComplete = () => loadFolders();
		loadFolders();
	}, [ loadFolders ] );

	// Drag-and-drop: make media attachments draggable, folder buttons droppable.
	useEffect( () => {
		if ( loading || typeof jQuery === 'undefined' || ! jQuery.ui ) return;

		const $ = jQuery;
		const DRAG_INIT_INTERVAL = 1000;

		// Make attachment items draggable.
		function initDraggables() {
			$( 'li.attachment:not(.ui-draggable)' ).draggable( {
				helper() {
					const $this = $( this );
					const ids = [];

					// Check for bulk-selected items (.selected on upload.php, aria-checked in modals).
					const $selected = $this.closest( '.attachments' ).find( 'li.attachment.selected, li.attachment[aria-checked="true"]' );
					if ( $selected.length > 1 && $this.is( '.selected, [aria-checked="true"]' ) ) {
						$selected.each( function () { ids.push( $( this ).data( 'id' ) ); } );
					} else {
						ids.push( $this.data( 'id' ) );
					}

					const $helper = $( '<div class="snel-drag-helper"></div>' );
					$helper.text( ids.length > 1 ? ids.length + ' items' : '1 item' );
					$helper.attr( 'data-ids', ids.join( ',' ) );
					$helper.css( {
						padding: '6px 12px',
						background: '#2271b1',
						color: '#fff',
						borderRadius: '4px',
						fontSize: '12px',
						fontWeight: '600',
						zIndex: 100000,
						pointerEvents: 'none',
					} );
					return $helper;
				},
				cursor: 'grabbing',
				cursorAt: { left: 10, top: 10 },
				distance: 5,
				appendTo: 'body',
				zIndex: 100000,
			} );
		}

		// Make folder buttons droppable.
		function initDroppables() {
			const sidebar = sidebarRef.current;
			if ( ! sidebar ) return;

			$( sidebar ).find( '[data-folder-id]' ).droppable( {
				accept: 'li.attachment',
				hoverClass: 'snel-drop-hover',
				tolerance: 'pointer',
				drop( event, ui ) {
					const folderId = parseInt( $( this ).attr( 'data-folder-id' ), 10 );
					const idsAttr = ui.helper.attr( 'data-ids' ) || '';
					const ids = idsAttr.split( ',' ).map( Number ).filter( Boolean );
					const folderName = $( this ).find( '.snel-folder-name' ).text() || __( 'folder', 'snel' );

					if ( ! ids.length ) return;

					api.assignFolder( folderId, ids ).then( () => {
						loadFolders();
						filterMediaByFolder( currentFolderId );
						createNotice( 'success', ids.length > 1
							? ids.length + ' ' + __( 'items moved to', 'snel' ) + ' ' + folderName
							: __( 'Moved to', 'snel' ) + ' ' + folderName,
						{ type: 'snackbar', isDismissible: true } );
					} ).catch( () => {
						createNotice( 'error', __( 'Failed to move items', 'snel' ),
							{ type: 'snackbar', isDismissible: true } );
					} );
				},
			} );
		}

		initDraggables();
		initDroppables();
		const interval = setInterval( initDraggables, DRAG_INIT_INTERVAL );

		return () => clearInterval( interval );
	}, [ loading, folders, loadFolders, createNotice ] );

	// Bulk toolbar: inject "Move to" dropdown next to "Delete permanently".
	useEffect( () => {
		if ( loading || typeof jQuery === 'undefined' || ! folders.length ) return;

		const $ = jQuery;
		const CONTAINER_ID = 'snel-bulk-move';

		function injectMoveDropdown() {
			// Find the delete button — only visible during bulk select mode.
			const $deleteBtn = $( '.button-primary.delete-selected-button' );
			if ( ! $deleteBtn.length || ! $deleteBtn.is( ':visible' ) || $( '#' + CONTAINER_ID ).length ) return;

			const $wrapper = $( '<span id="' + CONTAINER_ID + '" style="display:inline-flex;align-items:center;gap:6px;margin-left:8px;"></span>' );

			const $select = $( '<select class="snel-bulk-move-select"></select>' );
			$select.css( { fontSize: '13px', padding: '2px 6px', height: '30px', minWidth: '140px' } );
			$select.append( '<option value="">' + __( 'Move to...', 'snel' ) + '</option>' );

			// Build flat list with indentation for nested folders.
			function addOptions( parentId, depth ) {
				folders.filter( ( f ) => f.parent === parentId ).forEach( ( f ) => {
					const prefix = '\u00A0\u00A0'.repeat( depth );
					$select.append( '<option value="' + f.id + '">' + prefix + f.name + '</option>' );
					addOptions( f.id, depth + 1 );
				} );
			}
			addOptions( 0, 0 );

			$select.on( 'change', function () {
				const folderId = parseInt( $( this ).val(), 10 );
				if ( ! folderId ) return;

				const ids = [];
				$( 'li.attachment.selected, li.attachment[aria-checked="true"]' ).each( function () {
					ids.push( $( this ).data( 'id' ) );
				} );

				if ( ! ids.length ) {
					$( this ).val( '' );
					return;
				}

				const folderName = folders.find( ( f ) => f.id === folderId )?.name || __( 'folder', 'snel' );

				api.assignFolder( folderId, ids ).then( () => {
					loadFolders();
					filterMediaByFolder( currentFolderId );
					createNotice( 'success', ids.length > 1
						? ids.length + ' ' + __( 'items moved to', 'snel' ) + ' ' + folderName
						: __( 'Moved to', 'snel' ) + ' ' + folderName,
					{ type: 'snackbar', isDismissible: true } );
				} ).catch( () => {
					createNotice( 'error', __( 'Failed to move items', 'snel' ),
						{ type: 'snackbar', isDismissible: true } );
				} ).finally( () => {
					$( this ).val( '' );
				} );
			} );

			$wrapper.append( $select );
			$deleteBtn.after( $wrapper );
		}

		// Observe DOM for the bulk toolbar appearing/disappearing.
		injectMoveDropdown();
		const observer = new MutationObserver( () => {
			const $deleteBtn = $( '.button-primary.delete-selected-button' );
			if ( $deleteBtn.length && $deleteBtn.is( ':visible' ) ) {
				injectMoveDropdown();
			} else {
				$( '#' + CONTAINER_ID ).remove();
			}
		} );
		observer.observe( document.body, { childList: true, subtree: true } );

		return () => {
			observer.disconnect();
			$( '#' + CONTAINER_ID ).remove();
		};
	}, [ loading, folders, loadFolders, createNotice ] );

	const filteredFolders = useMemo( () => {
		if ( ! search.trim() ) return folders;
		const q = search.toLowerCase();
		return folders.filter( ( f ) => f.name.toLowerCase().includes( q ) );
	}, [ folders, search ] );

	const sortedFolders = useMemo( () => sortFolders( filteredFolders, sortBy ), [ filteredFolders, sortBy ] );

	const handleSelectFolder = ( id ) => {
		setActiveFolder( id );
		filterMediaByFolder( id );
	};

	const handleCreateFolder = async () => {
		if ( ! newFolderName.trim() ) {
			setIsCreating( false );
			return;
		}

		const parentId = activeFolder > 0 ? activeFolder : 0;

		try {
			await api.createFolder( newFolderName.trim(), parentId );
			await loadFolders();
		} catch ( err ) {
			console.error( '[MediaFolders] Create failed:', err );
		}

		setNewFolderName( '' );
		setIsCreating( false );
	};

	const handleKeyDown = ( e ) => {
		if ( e.key === 'Enter' ) handleCreateFolder();
		if ( e.key === 'Escape' ) {
			setIsCreating( false );
			setNewFolderName( '' );
		}
	};

	const handleDeleteFolder = async ( id ) => {
		try {
			await api.deleteFolder( id );
			await loadFolders();
			if ( activeFolder === id ) {
				setActiveFolder( -1 );
				filterMediaByFolder( -1 );
			}
		} catch ( err ) {
			console.error( '[MediaFolders] Delete failed:', err );
		}
	};

	const handleContextMenu = ( e, folder ) => {
		setContextMenu( { folder, position: { x: e.clientX, y: e.clientY } } );
	};

	const handleRenameFolder = async ( id, name ) => {
		try {
			await api.renameFolder( id, name );
			await loadFolders();
		} catch ( err ) {
			console.error( '[MediaFolders] Rename failed:', err );
		}
	};

	return (
		<div ref={ sidebarRef } className={ `bg-white flex flex-col ${ mode === 'page' ? 'w-72 min-w-72 border border-gray-200 rounded-lg mt-3 mb-3 mr-4 self-start' : 'w-full h-full overflow-hidden' }` }>
			{/* Header */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
				<span className="text-sm font-semibold text-gray-900">{ __( 'Folders', 'snel' ) }</span>
				<button
					className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded cursor-pointer hover:bg-blue-700 transition-colors border-none"
					onClick={ () => setIsCreating( true ) }
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<path d="M12 5v14"/><path d="M5 12h14"/>
					</svg>
					{ __( 'New Folder', 'snel' ) }
				</button>
			</div>

			{/* Search + Sort */}
			<div className="flex items-center gap-1 px-3 pt-2 pb-1">
				<div className="relative flex-1">
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a7aaad" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
						<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
					</svg>
					<input
						type="text"
						value={ search }
						onChange={ ( e ) => setSearch( e.target.value ) }
						placeholder={ __( 'Search folders...', 'snel' ) }
						style={ { paddingLeft: '32px' } }
						className="w-full pr-2 py-1.5 text-xs border border-gray-200 rounded bg-white text-gray-700 outline-none focus:border-blue-600 focus:shadow-[0_0_0_1px_#2271b1]"
					/>
				</div>
				<SortDropdown value={ sortBy } onChange={ setSortBy } />
			</div>

			{/* Folder list */}
			<div className="flex-1 overflow-y-auto py-1">
				{ loading ? (
					<div className="flex items-center justify-center py-8">
						<span className="text-xs text-gray-400">{ __( 'Loading...', 'snel' ) }</span>
					</div>
				) : (
					<>
						{/* All Files */}
						<button
							className={ `flex items-center gap-2 w-full px-3 py-2 text-[13px] text-left border-none cursor-pointer transition-colors ${ activeFolder === -1 ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900' }` }
							onClick={ () => handleSelectFolder( -1 ) }
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
							</svg>
							<span className="flex-1 truncate">{ __( 'All Files', 'snel' ) }</span>
							<span className={ `text-[11px] min-w-[20px] text-right ${ activeFolder === -1 ? 'text-white/70' : 'text-gray-400' }` }>{ totalCount }</span>
						</button>

						{/* Uncategorized */}
						<button
							data-folder-id="0"
							className={ `flex items-center gap-2 w-full px-3 py-2 text-[13px] text-left border-none cursor-pointer transition-colors ${ activeFolder === 0 ? 'bg-blue-600 text-white' : 'bg-transparent text-blue-600 font-medium hover:bg-gray-50' }` }
							onClick={ () => handleSelectFolder( 0 ) }
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
							</svg>
							<span className="flex-1 truncate">{ __( 'Uncategorized', 'snel' ) }</span>
							<span className={ `text-[11px] min-w-[20px] text-right ${ activeFolder === 0 ? 'text-white/70' : 'text-gray-400' }` }>{ uncategorizedCount }</span>
						</button>

						<div className="border-b border-gray-100 mx-3 my-1" />

						{/* Folder tree */}
						<FolderTree
							folders={ sortedFolders }
							activeFolder={ activeFolder }
							onSelect={ handleSelectFolder }
							parentId={ 0 }
							depth={ 0 }
							isCreating={ isCreating }
							newFolderParent={ activeFolder > 0 ? activeFolder : 0 }
							newFolderName={ newFolderName }
							onNewFolderNameChange={ setNewFolderName }
							onNewFolderConfirm={ handleCreateFolder }
							onNewFolderCancel={ () => { setIsCreating( false ); setNewFolderName( '' ); } }
							onNewFolderKeyDown={ handleKeyDown }
							onContextMenu={ handleContextMenu }
						/>

						{/* Empty state */}
						{ folders.length === 0 && ! isCreating && (
							<div className="px-4 py-2">
								<span className="text-[10px] tracking-widest text-gray-400 uppercase">
									{ __( 'No folders yet', 'snel' ) }
								</span>
							</div>
						) }
					</>
				) }
			</div>

			{/* Context menu */}
			{ contextMenu && (
				<FolderContextMenu
					folder={ contextMenu.folder }
					position={ contextMenu.position }
					onRename={ handleRenameFolder }
					onDelete={ handleDeleteFolder }
					onClose={ () => setContextMenu( null ) }
				/>
			) }

			{/* Snackbar notifications */}
			<SnackbarList
				notices={ snackbarNotices }
				onRemove={ removeNotice }
				className="snel-media-snackbar"
			/>
		</div>
	);
}
