import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Modal, Button } from '@wordpress/components';

export default function FolderToolbar( { activeFolder, folders, onDelete, onRename } ) {
	const [ isRenaming, setIsRenaming ] = useState( false );
	const [ renameValue, setRenameValue ] = useState( '' );
	const [ isDeleteModalOpen, setIsDeleteModalOpen ] = useState( false );

	const folder = folders.find( ( f ) => f.id === activeFolder );

	if ( activeFolder < 1 || ! folder ) return null;

	const handleStartRename = () => {
		setRenameValue( folder.name );
		setIsRenaming( true );
	};

	const handleConfirmRename = () => {
		if ( renameValue.trim() && renameValue.trim() !== folder.name ) {
			onRename( folder.id, renameValue.trim() );
		}
		setIsRenaming( false );
	};

	const handleCancelRename = () => {
		setIsRenaming( false );
		setRenameValue( '' );
	};

	const handleKeyDown = ( e ) => {
		if ( e.key === 'Enter' ) handleConfirmRename();
		if ( e.key === 'Escape' ) handleCancelRename();
	};

	const handleConfirmDelete = () => {
		onDelete( folder.id );
		setIsDeleteModalOpen( false );
	};

	return (
		<div className="flex items-center gap-1 px-4 py-2 border-b border-gray-100">
			{ isRenaming ? (
				<div className="flex items-center gap-1 flex-1">
					<input
						type="text"
						value={ renameValue }
						onChange={ ( e ) => setRenameValue( e.target.value ) }
						onKeyDown={ handleKeyDown }
						autoFocus
						className="flex-1 px-2 py-1 text-[13px] border border-blue-600 rounded outline-none focus:shadow-[0_0_0_1px_#2271b1]"
					/>
					<button
						onClick={ handleConfirmRename }
						className="flex items-center justify-center w-7 h-7 rounded text-green-600 hover:bg-green-50 cursor-pointer border-none bg-transparent transition-colors"
						title={ __( 'Confirm', 'snel' ) }
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
							<path d="M20 6 9 17l-5-5"/>
						</svg>
					</button>
					<button
						onClick={ handleCancelRename }
						className="flex items-center justify-center w-7 h-7 rounded text-red-500 hover:bg-red-50 cursor-pointer border-none bg-transparent transition-colors"
						title={ __( 'Cancel', 'snel' ) }
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
							<path d="M18 6 6 18"/><path d="m6 6 12 12"/>
						</svg>
					</button>
				</div>
			) : (
				<>
					<button
						className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 bg-transparent border border-gray-200 rounded cursor-pointer transition-colors hover:bg-gray-50 hover:text-gray-900"
						onClick={ handleStartRename }
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>
						</svg>
						{ __( 'Rename', 'snel' ) }
					</button>
					<button
						className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 bg-transparent border border-gray-200 rounded cursor-pointer transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-600"
						onClick={ () => setIsDeleteModalOpen( true ) }
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
						</svg>
						{ __( 'Delete', 'snel' ) }
					</button>
				</>
			) }

			{ isDeleteModalOpen && (
				<Modal
					title={ __( 'Delete folder', 'snel' ) }
					onRequestClose={ () => setIsDeleteModalOpen( false ) }
					size="small"
				>
					<p>
						{ __( 'Are you sure you want to delete', 'snel' ) } <strong>{ folder.name }</strong>?
					</p>
					<p className="text-gray-500 text-sm">
						{ __( 'Files inside this folder will not be deleted, they will be moved to Uncategorized.', 'snel' ) }
					</p>
					<div className="flex justify-end gap-2 mt-4">
						<Button
							variant="secondary"
							onClick={ () => setIsDeleteModalOpen( false ) }
						>
							{ __( 'Cancel', 'snel' ) }
						</Button>
						<Button
							variant="primary"
							isDestructive
							onClick={ handleConfirmDelete }
						>
							{ __( 'Delete', 'snel' ) }
						</Button>
					</div>
				</Modal>
			) }
		</div>
	);
}
